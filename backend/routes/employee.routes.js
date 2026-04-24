import express from 'express';
import mongoose from 'mongoose';
import Employee from '../models/Employee.js';
import Tenant from '../models/Tenant.js';
import { protect, tenantFilter, checkPermission } from '../middleware/auth.js';
import { describeSaudiId, normalizeSaudiId } from '../utils/saudiId.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);

function getSaudiIdentityDocument(documents) {
  if (!Array.isArray(documents)) return null;
  return documents.find((doc) => doc?.type === 'national_id' || doc?.type === 'iqama') || null;
}

function getEmployeeDisplayName(employee = {}) {
  return [employee?.firstNameEn, employee?.lastNameEn].filter(Boolean).join(' ').trim()
    || [employee?.firstNameAr, employee?.lastNameAr].filter(Boolean).join(' ').trim()
    || employee?.employeeId
    || '';
}

function buildDuplicateMeta(employee = null) {
  if (!employee) {
    return {
      exists: false,
    };
  }

  return {
    exists: true,
    employeeRecordId: String(employee?._id || ''),
    employeeId: employee?.employeeId || '',
    employeeName: getEmployeeDisplayName(employee),
  };
}

function buildLookupDetailsFromEmployee(employee = null) {
  if (!employee) return null;

  const saudiDocument = getSaudiIdentityDocument(employee?.documents);

  return {
    employeeId: employee.employeeId,
    firstNameEn: employee.firstNameEn,
    lastNameEn: employee.lastNameEn,
    firstNameAr: employee.firstNameAr,
    lastNameAr: employee.lastNameAr,
    email: employee.email,
    phone: employee.phone,
    alternatePhone: employee.alternatePhone,
    dateOfBirth: employee.dateOfBirth,
    nationality: employee.nationality,
    gender: employee.gender,
    maritalStatus: employee.maritalStatus,
    bloodGroup: employee.bloodGroup,
    nationalIdIssueDate: employee.nationalIdIssueDate || saudiDocument?.issueDate,
    nationalIdExpiry: employee.nationalIdExpiry || saudiDocument?.expiryDate,
    idCardFront: employee.idCardFront,
    idCardBack: employee.idCardBack,
    insurance: employee.insurance,
    address: employee.address,
  };
}

function getIdentityIntegrationSettings(tenant = {}) {
  const saudiIntegrations = tenant?.settings?.saudiIntegrations || {};
  const identity = saudiIntegrations?.identity || {};

  return {
    enabled: saudiIntegrations?.enabled !== false && identity?.enabled === true,
    provider: String(identity?.provider || 'custom_webhook').trim() || 'custom_webhook',
    endpoint: String(identity?.endpoint || '').trim(),
    apiKey: String(identity?.apiKey || '').trim(),
    ocrEnabled: identity?.ocrEnabled === true,
  };
}

async function runIdentityProviderLookup({ tenant, mode = 'id', nationalId = '', idCardFront = '', idCardBack = '', language = 'en' }) {
  const settings = getIdentityIntegrationSettings(tenant);

  if (!settings.enabled || !settings.endpoint) {
    return {
      providerAvailable: false,
      configured: false,
      details: null,
      message: 'Identity provider is not configured',
    };
  }

  if (mode === 'ocr' && !settings.ocrEnabled) {
    return {
      providerAvailable: false,
      configured: true,
      details: null,
      message: 'Identity OCR is not enabled',
    };
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (settings.apiKey) {
    headers.Authorization = `Bearer ${settings.apiKey}`;
  }

  const response = await fetch(settings.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      mode,
      language,
      nationalId: normalizeSaudiId(nationalId),
      images: {
        front: typeof idCardFront === 'string' ? idCardFront : '',
        back: typeof idCardBack === 'string' ? idCardBack : '',
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Identity provider request failed');
  }

  const details = payload?.details && typeof payload.details === 'object'
    ? payload.details
    : payload?.lookup && typeof payload.lookup === 'object'
      ? payload.lookup
      : payload && typeof payload === 'object'
        ? payload
        : null;

  return {
    providerAvailable: true,
    configured: true,
    details,
    message: payload?.message || 'Identity details returned by provider',
  };
}

async function findEmployeeBySaudiId({ tenantFilterValue, normalizedId, excludeEmployeeId }) {
  if (!normalizedId) return null;

  const query = {
    ...tenantFilterValue,
    $or: [
      { nationalId: normalizedId },
      { 'documents.number': normalizedId },
    ],
  };

  if (excludeEmployeeId && mongoose.isValidObjectId(excludeEmployeeId)) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeEmployeeId) };
  }

  return await Employee.findOne(query).select([
    'employeeId',
    'firstNameEn',
    'lastNameEn',
    'firstNameAr',
    'lastNameAr',
    'email',
    'phone',
    'alternatePhone',
    'dateOfBirth',
    'nationality',
    'gender',
    'maritalStatus',
    'bloodGroup',
    'nationalId',
    'nationalIdIssueDate',
    'nationalIdExpiry',
    'idCardFront',
    'idCardBack',
    'documents',
    'insurance',
    'address',
  ].join(' '));
}

// @route   GET /api/employees
router.get('/', checkPermission('hr', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, nationality, department, search } = req.query;
    
    const query = { ...req.tenantFilter };
    
    if (status) query.status = status;
    if (nationality) query.nationality = nationality;
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { firstNameEn: { $regex: search, $options: 'i' } },
        { lastNameEn: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const employees = await Employee.find(query)
      .select('-documents.fileUrl -salaryHistory -idCardProof -idCardFront -idCardBack')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Employee.countDocuments(query);
    
    res.json({
      employees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/employees/stats
router.get('/stats', checkPermission('hr', 'read'), async (req, res) => {
  try {
    const stats = await Employee.aggregate([
      { $match: { ...req.tenantFilter, isActive: true } },
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byNationality: [
            { $group: { _id: '$nationality', count: { $sum: 1 } } }
          ],
          byDepartment: [
            { $group: { _id: '$department', count: { $sum: 1 } } }
          ],
          expiringDocuments: [
            {
              $project: {
                expiryCandidates: {
                  $concatArrays: [
                    {
                      $map: {
                        input: { $ifNull: ['$documents', []] },
                        as: 'doc',
                        in: {
                          expiryDate: '$$doc.expiryDate',
                        }
                      }
                    },
                    {
                      $cond: [
                        {
                          $and: [
                            { $eq: ['$nationalIdType', 'iqama'] },
                            { $ne: ['$nationalIdExpiry', null] },
                          ]
                        },
                        [{ expiryDate: '$nationalIdExpiry' }],
                        []
                      ]
                    }
                  ]
                }
              }
            },
            { $unwind: '$expiryCandidates' },
            {
              $match: {
                'expiryCandidates.expiryDate': {
                  $lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
                }
              }
            },
            { $count: 'count' }
          ],
          totalEmployees: [
            { $count: 'count' }
          ]
        }
      }
    ]);
    
    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/lookup-saudi-id', checkPermission('hr', 'read'), async (req, res) => {
  try {
    const normalizedId = normalizeSaudiId(req.body?.nationalId);
    const saudiIdMeta = describeSaudiId(normalizedId);
    const excludeEmployeeId = String(req.body?.excludeEmployeeId || '').trim();

    if (!normalizedId) {
      return res.status(400).json({ error: 'National ID / Iqama is required' });
    }

    if (!saudiIdMeta.valid || !saudiIdMeta.type) {
      return res.status(400).json({
        error: 'Invalid Saudi National ID / Iqama',
        lookup: {
          nationalId: normalizedId,
          ...saudiIdMeta,
          source: 'validation_only',
          providerAvailable: false,
          duplicate: { exists: false },
          details: null,
        },
      });
    }

    const employee = await findEmployeeBySaudiId({
      tenantFilterValue: req.tenantFilter,
      normalizedId,
      excludeEmployeeId,
    });
    const duplicate = buildDuplicateMeta(employee);

    let providerLookup = {
      providerAvailable: false,
      configured: false,
      details: null,
      message: 'Identity provider is not configured',
    };

    if (!employee) {
      const tenant = await Tenant.findById(req.user.tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      providerLookup = await runIdentityProviderLookup({
        tenant,
        mode: 'id',
        nationalId: normalizedId,
        language: req.body?.language === 'ar' ? 'ar' : 'en',
      });
    }

    const providerDetails = providerLookup?.details && typeof providerLookup.details === 'object' ? providerLookup.details : null;

    res.json({
      lookup: {
        nationalId: normalizedId,
        ...saudiIdMeta,
        source: employee ? 'tenant_records' : providerDetails ? 'provider_live' : 'validation_only',
        providerAvailable: providerLookup.providerAvailable === true,
        duplicate,
        details: employee ? buildLookupDetailsFromEmployee(employee) : providerDetails,
        message: employee
          ? 'Details found from existing employee records'
          : providerDetails
            ? providerLookup.message || 'Identity details returned by provider'
            : providerLookup.message || 'ID validated, but no saved details were found in tenant records',
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/lookup-saudi-id-images', checkPermission('hr', 'read'), async (req, res) => {
  try {
    const idCardFront = String(req.body?.idCardFront || '').trim();
    const idCardBack = String(req.body?.idCardBack || '').trim();
    const fallbackNationalId = normalizeSaudiId(req.body?.nationalId);
    const excludeEmployeeId = String(req.body?.excludeEmployeeId || '').trim();

    if (!idCardFront && !idCardBack) {
      return res.status(400).json({ error: 'At least one ID image is required' });
    }

    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const providerLookup = await runIdentityProviderLookup({
      tenant,
      mode: 'ocr',
      nationalId: fallbackNationalId,
      idCardFront,
      idCardBack,
      language: req.body?.language === 'ar' ? 'ar' : 'en',
    });

    const providerDetails = providerLookup?.details && typeof providerLookup.details === 'object' ? providerLookup.details : null;
    const normalizedId = normalizeSaudiId(providerDetails?.nationalId || fallbackNationalId);
    const saudiIdMeta = describeSaudiId(normalizedId);
    const duplicateEmployee = normalizedId
      ? await findEmployeeBySaudiId({
          tenantFilterValue: req.tenantFilter,
          normalizedId,
          excludeEmployeeId,
        })
      : null;

    res.json({
      lookup: {
        nationalId: normalizedId || undefined,
        ...saudiIdMeta,
        source: providerDetails ? 'provider_ocr' : 'ocr_unavailable',
        providerAvailable: providerLookup.providerAvailable === true,
        duplicate: buildDuplicateMeta(duplicateEmployee),
        details: providerDetails,
        message: providerLookup.message || 'No OCR details were returned',
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/employees/:id
router.get('/:id', checkPermission('hr', 'read'), async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      ...req.tenantFilter
    }).populate('manager', 'firstNameEn lastNameEn employeeId');
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/employees
router.post('/', checkPermission('hr', 'create'), async (req, res) => {
  try {
    const employeeData = {
      ...req.body,
      tenantId: req.user.tenantId
    };
    
    const employee = await Employee.create(employeeData);
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/employees/:id
router.put('/:id', checkPermission('hr', 'update'), async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      ...req.tenantFilter
    });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    Object.assign(employee, req.body);
    await employee.save();
    
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/employees/:id/documents
router.post('/:id/documents', checkPermission('hr', 'update'), async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      ...req.tenantFilter
    });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    employee.documents.push(req.body);
    await employee.save();
    
    res.status(201).json(employee.documents[employee.documents.length - 1]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/employees/:id/salary
router.put('/:id/salary', checkPermission('hr', 'update'), async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      ...req.tenantFilter
    });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Archive current salary
    if (employee.currentSalary) {
      employee.salaryHistory.push(employee.currentSalary);
    }
    
    employee.currentSalary = {
      ...req.body,
      effectiveDate: req.body.effectiveDate || new Date()
    };
    
    await employee.save();
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/employees/:id/terminate
router.post('/:id/terminate', checkPermission('hr', 'update'), async (req, res) => {
  try {
    const { terminationDate, terminationReason } = req.body;
    
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      {
        status: 'terminated',
        terminationDate,
        terminationReason,
        isActive: false
      },
      { new: true }
    );
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/employees/:id/expiring-documents
router.get('/:id/expiring-documents', checkPermission('hr', 'read'), async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      ...req.tenantFilter
    });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 60);
    
    const expiringDocs = employee.documents.filter(doc => {
      return doc.expiryDate && new Date(doc.expiryDate) <= thirtyDaysFromNow;
    });
    
    res.json(expiringDocs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

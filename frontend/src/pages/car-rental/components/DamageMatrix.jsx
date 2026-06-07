import React, { useState } from 'react';

const DamageMatrix = ({ initialPins = [], onPinsChange, readOnly = false }) => {
  const [pins, setPins] = useState(initialPins);
  const [selectedSeverity, setSelectedSeverity] = useState('Scratch');

  const handleImageClick = (e) => {
    if (readOnly) return;
    
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Determine basic panel based on coordinates (simplified logic)
    let panel = 'Body';
    if (y < 20) panel = 'Front Bumper / Hood';
    else if (y > 80) panel = 'Rear Bumper / Trunk';
    else if (x < 30) panel = 'Left Side';
    else if (x > 70) panel = 'Right Side';
    else panel = 'Roof / Glass';

    const newPin = { x, y, panel, severity: selectedSeverity };
    const updatedPins = [...pins, newPin];
    
    setPins(updatedPins);
    if (onPinsChange) {
      onPinsChange(updatedPins);
    }
  };

  const removePin = (index) => {
    if (readOnly) return;
    const updatedPins = pins.filter((_, i) => i !== index);
    setPins(updatedPins);
    if (onPinsChange) {
      onPinsChange(updatedPins);
    }
  };

  const severityColors = {
    'Scratch': 'bg-yellow-400',
    'Dent': 'bg-orange-500',
    'Major Damage': 'bg-red-600'
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 bg-white p-4 rounded shadow-sm border border-gray-200">
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-2">Vehicle Damage Matrix</h3>
        {!readOnly && (
          <div className="mb-4 flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="severity" checked={selectedSeverity === 'Scratch'} onChange={() => setSelectedSeverity('Scratch')} />
              <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span> Scratch
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="severity" checked={selectedSeverity === 'Dent'} onChange={() => setSelectedSeverity('Dent')} />
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span> Dent
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="severity" checked={selectedSeverity === 'Major Damage'} onChange={() => setSelectedSeverity('Major Damage')} />
              <span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span> Major Damage
            </label>
          </div>
        )}

        {/* SVG Container for the generic car top-down view */}
        <div className="relative border border-gray-300 rounded overflow-hidden" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <svg 
            viewBox="0 0 200 400" 
            className="w-full h-auto cursor-crosshair bg-gray-50"
            onClick={handleImageClick}
          >
            {/* Extremely simplified top-down car shape for the matrix */}
            <rect x="40" y="20" width="120" height="360" rx="20" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />
            <rect x="50" y="80" width="100" height="100" rx="10" fill="#d1d5db" /> {/* Windshield/Roof/Rear glass abstraction */}
            <rect x="50" y="220" width="100" height="60" rx="10" fill="#d1d5db" />
            {/* Wheels */}
            <rect x="30" y="60" width="10" height="40" rx="2" fill="#374151" />
            <rect x="160" y="60" width="10" height="40" rx="2" fill="#374151" />
            <rect x="30" y="300" width="10" height="40" rx="2" fill="#374151" />
            <rect x="160" y="300" width="10" height="40" rx="2" fill="#374151" />
          </svg>

          {/* Render Pins */}
          {pins.map((pin, idx) => (
            <div 
              key={idx}
              className={`absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white cursor-pointer ${severityColors[pin.severity]} animate-pulse`}
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              title={`${pin.panel}: ${pin.severity}`}
              onClick={(e) => {
                e.stopPropagation();
                removePin(idx);
              }}
            />
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2 text-center">
          {readOnly ? 'Hover over markers for details.' : 'Click on the vehicle diagram to add a damage marker. Click a marker to remove it.'}
        </p>
      </div>

      <div className="w-full md:w-64">
        <h4 className="font-semibold mb-2">Damage Log</h4>
        {pins.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No damage recorded.</p>
        ) : (
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {pins.map((pin, idx) => (
              <li key={idx} className="text-sm border-b pb-2 flex justify-between items-start">
                <div>
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${severityColors[pin.severity]}`}></span>
                  <span className="font-medium">{pin.panel}</span>
                  <div className="text-xs text-gray-600 ml-4">{pin.severity}</div>
                </div>
                {!readOnly && (
                  <button onClick={() => removePin(idx)} className="text-red-500 hover:text-red-700 text-xs">
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DamageMatrix;

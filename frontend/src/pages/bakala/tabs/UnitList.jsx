import React from 'react';
import SimpleCrudList from './SimpleCrudList';

export default function UnitList() {
  return <SimpleCrudList endpoint="/bakala-products/units" title="Units" itemLabel="Unit" />;
}

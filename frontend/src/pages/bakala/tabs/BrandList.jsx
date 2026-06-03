import React from 'react';
import SimpleCrudList from './SimpleCrudList';

export default function BrandList() {
  return <SimpleCrudList endpoint="/bakala-products/brands" title="Brands" itemLabel="Brand" />;
}

import React from 'react';
import SimpleCrudList from './SimpleCrudList';

export default function CategoryList() {
  return <SimpleCrudList endpoint="/bakala-products/categories" title="Categories" itemLabel="Category" />;
}

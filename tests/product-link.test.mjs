import {test} from 'node:test';
import assert from 'node:assert/strict';
import {productLink,productPath} from '../lib/product-link.ts';
test('product links use a stable public path without carrying account or checkout parameters',()=>{
  const link=productLink('https://loja.example/produto/old?pedido=private','novo id');
  assert.equal(link,'https://loja.example/produto/novo%20id');
  assert.equal(productPath('caju'),'/produto/caju');
  assert.equal(new URL(link).search,'');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {sameOrigin} from '../lib/supabase/http.ts';

test('public production origin is accepted behind the Netlify internal URL',()=>{
  const before=process.env.NODE_ENV;
  process.env.NODE_ENV='production';
  try {
    const request=new Request('http://localhost:3000/api/auth',{headers:{origin:'https://nativa-bem-viver.netlify.app'}});
    assert.equal(sameOrigin(request),true);
    assert.equal(sameOrigin(new Request(request.url,{headers:{origin:'https://evil.example'}})),false);
    assert.equal(sameOrigin(new Request(request.url,{headers:{origin:'https://nativa-bem-viver.netlify.app.evil.example'}})),false);
    assert.equal(sameOrigin(new Request(request.url,{headers:{origin:'http://localhost:3000'}})),false);
    assert.equal(sameOrigin(new Request(request.url,{headers:{origin:'null'}})),false);
  } finally {
    if(before===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=before;
  }
});

test('custom public domain can be configured without trusting forwarded headers',()=>{
  const before=process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL='https://loja.example';
  try {
    assert.equal(sameOrigin(new Request('http://localhost:3000/api/auth',{headers:{origin:'https://loja.example'}})),true);
    assert.equal(sameOrigin(new Request('http://localhost:3000/api/auth',{headers:{origin:'https://evil.example','x-forwarded-host':'evil.example','x-forwarded-proto':'https'}})),false);
  } finally {
    if(before===undefined)delete process.env.NEXT_PUBLIC_SITE_URL;else process.env.NEXT_PUBLIC_SITE_URL=before;
  }
});

test('local development accepts only the same local origin',()=>{
  const before=process.env.NODE_ENV;
  process.env.NODE_ENV='development';
  try {
    assert.equal(sameOrigin(new Request('http://localhost:3000/api/auth',{headers:{origin:'http://localhost:3000'}})),true);
    assert.equal(sameOrigin(new Request('http://localhost:3000/api/auth',{headers:{origin:'http://localhost:4000'}})),false);
  } finally {
    if(before===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=before;
  }
});

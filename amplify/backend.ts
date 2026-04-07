import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { Tags } from 'aws-cdk-lib';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
defineBackend({
  auth,
  data,
  storage
});

// Access the underlying S3 bucket and add tags
const s3Bucket = backend.storage.resources.bucket;
Tags.of(s3Bucket).add('cost:business-unit', 'qfind');
Tags.of(s3Bucket).add('cost:application', 'qfind mobile application');
Tags.of(s3Bucket).add('cost:component', 'bucket');
Tags.of(s3Bucket).add('cost:environment', 'dev');
Tags.of(s3Bucket).add('managed:by', 'cto');
Tags.of(s3Bucket).add('owner', 'dan.kakon');

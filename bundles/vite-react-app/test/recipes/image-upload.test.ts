import { describe, it, expect } from 'vitest';
import { enrich, generateFiles } from '../../src/index.js';

const meta = { name: 'demo', apiVersion: '1.0' };

const IMAGE_OUTPUTS = [
  'src/types/image.ts',
  'src/lib/images.ts',
  'src/components/ImageUpload.tsx',
  'src/components/ImageGallery.tsx',
];

describe('vite-react-app image-upload recipe', () => {
  it('does not generate any image files when recipe is disabled', () => {
    const ctx = enrich({ appName: 'plain-app' }, meta);
    expect(ctx.recipeImageUpload).toBe(false);
    expect(ctx.recipes).toEqual([]);
    expect(ctx.imageUpload.apiPath).toBe('/images'); // default still resolved
    const outputs = generateFiles(ctx).map((f) => f.output);
    for (const expected of IMAGE_OUTPUTS) {
      expect(outputs).not.toContain(expected);
    }
  });

  it('generates all image-upload files when recipe is enabled', () => {
    const ctx = enrich(
      {
        appName: 'media-app',
        recipes: ['image-upload'],
        imageUpload: { apiPath: '/api/images' },
      },
      meta,
    );
    expect(ctx.recipeImageUpload).toBe(true);
    expect(ctx.recipes).toEqual(['image-upload']);
    expect(ctx.imageUpload.apiPath).toBe('/api/images');

    const files = generateFiles(ctx);
    const outputs = files.map((f) => f.output);
    for (const expected of IMAGE_OUTPUTS) {
      expect(outputs, `missing ${expected}`).toContain(expected);
    }

    // ImageUpload.tsx is an extension point.
    const upload = files.find((f) => f.output === 'src/components/ImageUpload.tsx');
    expect(upload?.overwrite).toBe(false);
    // ImageGallery.tsx is generated (overwrite default = true).
    const gallery = files.find((f) => f.output === 'src/components/ImageGallery.tsx');
    expect(gallery?.overwrite).not.toBe(false);
  });
});

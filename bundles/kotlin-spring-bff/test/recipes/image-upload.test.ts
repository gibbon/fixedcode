import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { enrich, generateFiles } from '../../src/index.js';

const md = { name: 'my-bff', apiVersion: '1.0' };

const IMAGE_FILE_TAILS = [
  'api/ImagesController.kt',
  'service/ImageService.kt',
  'service/LocalImageService.kt',
  'dto/ImageDto.kt',
  'exception/ImageNotFoundException.kt',
  'exception/ImageProcessingException.kt',
];

describe('kotlin-spring-bff image-upload recipe', () => {
  it('does not generate any image files when recipe is disabled', () => {
    const ctx = enrich({ appName: 'my-bff', groupId: 'com.example' }, md);
    expect(ctx.recipeImageUpload).toBe(false);
    expect(ctx.recipes).toEqual([]);
    const files = generateFiles(ctx);
    const imageOutputs = files.filter(
      (f) =>
        f.output.includes('/Image') ||
        f.output.endsWith('ImagesController.kt') ||
        f.output.endsWith('application-image-upload.yml'),
    );
    expect(imageOutputs).toEqual([]);
  });

  it('generates all image-upload files (and config) when recipe is enabled', () => {
    const ctx = enrich(
      { appName: 'my-bff', groupId: 'com.example', recipes: ['image-upload'] },
      md,
    );
    expect(ctx.recipeImageUpload).toBe(true);
    expect(ctx.recipes).toEqual(['image-upload']);

    const files = generateFiles(ctx);
    const outputs = files.map((f) => f.output);
    for (const tail of IMAGE_FILE_TAILS) {
      expect(
        outputs.some((o) => o.endsWith(tail)),
        `missing ${tail}`,
      ).toBe(true);
    }
    expect(outputs).toContain('src/main/resources/application-image-upload.yml');

    // LocalImageService is an extension point — must NOT be overwritten on regen.
    const local = files.find((f) => f.output.endsWith('LocalImageService.kt'));
    expect(local?.overwrite).toBe(false);

    // The image-upload yml template uses the canonical app.images.* keys.
    const ymlTemplate = readFileSync(
      join(
        __dirname,
        '..',
        '..',
        'templates',
        'recipes',
        'image-upload',
        'resources',
        'application-image-upload.yml.hbs',
      ),
      'utf-8',
    );
    expect(ymlTemplate).toMatch(/app:\s*\n\s*images:/);
    expect(ymlTemplate).toContain('dir:');
    expect(ymlTemplate).toContain('maxSizeBytes:');
    expect(ymlTemplate).toContain('allowedMimeTypes:');
  });
});

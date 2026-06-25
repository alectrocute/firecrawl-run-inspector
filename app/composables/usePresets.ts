import type { Preset } from '~/types'

/** Curated, ready-to-run action sequences that demonstrate each outcome. */
export function usePresets(): Preset[] {
  return [
    {
      id: 'happy-path',
      name: $t('presets.happyPath.name'),
      description: $t('presets.happyPath.description'),
      url: 'https://httpbin.org/forms/post',
      actions: [
        { type: 'wait', milliseconds: 500 },
        { type: 'write', selector: 'input[name="custname"]', text: 'Test User' },
        { type: 'click', selector: 'body > form > p:nth-child(8) > button' },
        { type: 'wait', milliseconds: 1000 },
      ],
    },
    {
      id: 'broken-selector',
      name: $t('presets.brokenSelector.name'),
      description: $t('presets.brokenSelector.description'),
      url: 'https://httpbin.org/forms/post',
      actions: [
        { type: 'wait', milliseconds: 500 },
        { type: 'write', selector: 'input[name="custname"]', text: 'Test User' },
        { type: 'click', selector: '#nonexistent-button-xyz' },
        { type: 'wait', milliseconds: 1000 },
      ],
    },
    {
      id: 'multi-step',
      name: $t('presets.multiStep.name'),
      description: $t('presets.multiStep.description'),
      url: 'https://httpbin.org/links/10/0',
      actions: [
        { type: 'wait', milliseconds: 500 },
        { type: 'click', selector: 'a[href*="links/10/1"]' },
      ],
    },
  ]
}

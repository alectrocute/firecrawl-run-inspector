import { translate, translateList } from '#shared/utils/i18n'

/**
 * App-wide copy helpers, auto-imported into every component and composable.
 * `$t` mirrors the familiar vue-i18n convention; `$tm` returns list messages.
 * All copy lives in `locales/en.json` — see `#shared/utils/i18n`.
 */
export const $t = translate
export const $tm = translateList

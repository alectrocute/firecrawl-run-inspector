import type { UserAction } from '~/types'
import { truncate } from './format'
import { $t } from './i18n'

/** Human-readable, one-line summary of a single action. Pure presentation. */
export function actionLabel(action: UserAction): string {
  switch (action.type) {
    case 'wait':
      return $t('actionLabels.wait', { ms: action.milliseconds ?? '?' })
    case 'click':
      return $t('actionLabels.click', { selector: action.selector ?? '?' })
    case 'screenshot':
      return action.fullPage ? $t('actionLabels.screenshotFullPage') : $t('actionLabels.screenshot')
    case 'write':
      return $t('actionLabels.write', { text: truncate(action.text ?? '', 30) })
    case 'press':
      return $t('actionLabels.press', { key: action.key ?? '?' })
    case 'scroll':
      return $t('actionLabels.scroll', { direction: action.direction ?? 'down' })
    case 'scrape':
      return $t('actionLabels.scrape')
    case 'executeJavascript':
      return $t('actionLabels.executeJavascript', { script: truncate(action.script ?? '', 40) })
    default:
      return action.type
  }
}

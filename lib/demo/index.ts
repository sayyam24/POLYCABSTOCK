export { generateDemoDataset, type GeneratedDemoData, type DemoCredential } from '@/lib/demo/generator'
export { computeDemoAnalytics, type DemoAnalytics } from '@/lib/demo/analytics'
export {
  generateAndApplyDemoData,
  resetAllDemoData,
  ensureDemoOnStartup,
  isDemoSeededLocally,
  applyDemoToLocal,
} from '@/lib/demo/persist'
export { DEMO_COUNTS, DEMO_PASSWORD, DEMO_EMAIL_DOMAIN } from '@/lib/demo/constants'

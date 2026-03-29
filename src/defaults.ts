// Single source of truth for values injected into generated code.
// Change a value here and every affected template picks it up.

/** Standard routes — chat, structured-output, audio, content-moderation, etc. */
export const MAX_DURATION_STANDARD = '30'

/** Heavy routes — agents, multi-agent, document-processing, image-gen */
export const MAX_DURATION_HEAVY = '60'

/** Max tool-call steps for a single agent loop */
export const MAX_STEPS_AGENT = '20'

/** Max tool-call steps for a multi-agent orchestrator */
export const MAX_STEPS_MULTI_AGENT = '10'

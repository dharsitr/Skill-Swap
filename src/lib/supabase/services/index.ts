export { authService, formatAuthError } from "./authService";
export { profileService } from "./profileService";
export { skillService } from "./skillService";
export type { UserSkillWithDetails } from "./skillService";
export {
  availabilityService,
  DAY_INDEX_MAP,
  DAY_NAME_MAP,
  SLOT_TIME_MAP,
} from "./availabilityService";
export { storageService } from "./storageService";
export { sessionService } from "./sessionService";
export type {
  SessionWithRelations,
  AvailableSlot,
  BookSessionParams,
  SessionMutationResult,
} from "./sessionService";
export { creditService } from "./creditService";
export type { WalletSummary, CreditMutationResult } from "./creditService";
export { notificationService } from "./notificationService";
export type { NotificationType } from "./notificationService";
export { discoveryService } from "./discoveryService";
export type {
  DiscoverableUser,
  DiscoverableSkill,
  DiscoverableAvailability,
} from "./discoveryService";
export { connectionService } from "./connectionService";
export type { ConnectionStatusResult } from "./connectionService";
export { chatService } from "./chatService";
export type { ChatMessage, ConversationWithDetails } from "./chatService";
export { reviewService } from "./reviewService";
export {
  settingsService,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_PRIVACY_PREFERENCES,
  DEFAULT_USER_PREFERENCES,
} from "./settingsService";
export type { UserDataExport } from "./settingsService";
export * from "./utils";


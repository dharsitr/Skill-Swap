export interface HealthResponse {
  status: string;
}

export interface VersionResponse {
  name: string;
  version: string;
}

export type YearOfStudy = 'FIRST_YEAR' | 'SECOND_YEAR' | 'THIRD_YEAR' | 'FOURTH_YEAR' | 'OTHER';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface UserResponse {
  id: string;
  authUserId: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileResponse {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  collegeName: string;
  department?: string | null;
  yearOfStudy: YearOfStudy;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  collegeName: string;
  department?: string | null;
  yearOfStudy: YearOfStudy;
}

// Phase 3 Skills Domain Types
export type SkillRelationshipType = 'TEACH' | 'LEARN';

export type SkillProficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface SkillCategory {
  id: string;
  name: string;
  description?: string | null;
}

export interface CategoryListResponse {
  items: SkillCategory[];
}

export interface Skill {
  id: string;
  name: string;
  description?: string | null;
  category: SkillCategory;
  categoryName?: string | null;
}

export interface SkillListResponse {
  items: Skill[];
}

export interface UserSkill {
  id: string;
  skillId: string;
  skillName: string;
  categoryId?: string | null;
  categoryName?: string | null;
  relationshipType: SkillRelationshipType;
  proficiency: SkillProficiency;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSkillProfileResponse {
  teaching: UserSkill[];
  learning: UserSkill[];
}

export interface CreateUserSkillRequest {
  skillId: string;
  relationshipType: SkillRelationshipType;
  proficiency: SkillProficiency;
  description?: string | null;
}

export interface UpdateUserSkillRequest {
  proficiency: SkillProficiency;
  description?: string | null;
}

// Phase 4 Discovery & Matching Types
export type DiscoveryMode = 'LEARN' | 'TEACH' | 'GENERAL';

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface PublicUserSkill {
  id: string;
  skillId: string;
  skillName: string;
  categoryId?: string | null;
  categoryName?: string | null;
  relationshipType: SkillRelationshipType;
  proficiency: SkillProficiency;
  description?: string | null;
}

export interface PublicProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  collegeName: string;
  department?: string | null;
  yearOfStudy: YearOfStudy;
  teachingSkills: PublicUserSkill[];
  learningSkills: PublicUserSkill[];
  createdAt: string;
}

export interface DiscoveryCandidate {
  candidate: PublicProfile;
  score: number;
  matchedSkills: string[];
  explanation: string[];
}

export interface DiscoveryFilterParams {
  mode?: DiscoveryMode;
  search?: string;
  skillId?: string;
  categoryId?: string;
  proficiency?: SkillProficiency;
  page?: number;
  size?: number;
  sort?: string;
}

// Phase 5 Exchange Requests & Session Management Types
export type ExchangeRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export type SessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ExchangeParticipant {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  collegeName: string;
  department?: string | null;
  yearOfStudy?: YearOfStudy | null;
}

export interface ExchangeRequestSkill {
  id: string;
  name: string;
  categoryName?: string | null;
  proficiency?: SkillProficiency | null;
}

export interface ExchangeRequest {
  id: string;
  requester: ExchangeParticipant;
  recipient: ExchangeParticipant;
  skill: ExchangeRequestSkill;
  message?: string | null;
  status: ExchangeRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExchangeRequestParams {
  recipientId: string;
  skillId: string;
  message?: string;
}

export interface Session {
  id: string;
  exchangeRequestId: string;
  teacher: ExchangeParticipant;
  learner: ExchangeParticipant;
  skill: ExchangeRequestSkill;
  status: SessionStatus;
  scheduledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Phase 6 Credit Economy & Transactions Types
export type CreditTransactionDirection = 'CREDIT' | 'DEBIT';

export type CreditTransactionType = 'INITIAL_CREDIT' | 'SESSION_EARNING' | 'SESSION_SPENDING';

export interface CreditWallet {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditBalance {
  balance: number;
}

export interface CreditTransaction {
  id: string;
  walletId: string;
  userId: string;
  amount: number;
  direction: CreditTransactionDirection;
  type: CreditTransactionType;
  sessionId?: string | null;
  referenceType?: string | null;
  description?: string | null;
  createdAt: string;
}

export interface SessionSettlement {
  sessionId: string;
  status: 'SETTLED' | 'ALREADY_SETTLED';
  amount: number;
}

// Phase 7 Real-Time Chat & Messaging Types
export interface ConversationParticipant {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  collegeName: string;
  department?: string | null;
  lastReadAt?: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  clientMessageId?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  otherParticipant: ConversationParticipant;
  lastMessage?: ChatMessage | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface MarkReadResponse {
  conversationId: string;
  markedCount: number;
}

export type ChatConnectionState = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';

export interface ChatWebSocketMessage {
  type: 'SEND_MESSAGE' | 'MESSAGE_CREATED' | 'MESSAGE_ACK' | 'MARK_READ' | 'MESSAGE_READ' | 'TYPING_START' | 'TYPING_STOP' | 'ERROR';
  conversationId?: string;
  userId?: string;
  content?: string;
  clientMessageId?: string;
  messageId?: string;
  messageIds?: string[];
  message?: ChatMessage;
  code?: string;
  error?: string;
}



// Phase 10 Reviews, Ratings, Blocking, Reporting, Disputes & Moderation
export interface CreateReviewRequest {
  sessionId: string;
  rating: number;
  comment?: string;
}

export interface ReviewResponse {
  id: string;
  sessionId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatarUrl?: string | null;
  revieweeId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface RatingSummaryResponse {
  userId: string;
  averageRating: number | null;
  reviewCount: number;
}

export interface SessionReviewStatusResponse {
  sessionId: string;
  eligible: boolean;
  hasReviewed: boolean;
  review?: ReviewResponse | null;
}

export interface BlockUserRequest {
  blockedUserId: string;
}

export interface UserBlockResponse {
  id: string;
  blockedUserId: string;
  blockedUserName: string;
  blockedUserAvatarUrl?: string | null;
  createdAt: string;
}

export interface BlockStatusResponse {
  targetUserId: string;
  blockedByMe: boolean;
  blockedByTarget: boolean;
  isBlockedMutually?: boolean;
}

export type ReportReason =
  | 'HARASSMENT'
  | 'INAPPROPRIATE_BEHAVIOR'
  | 'SPAM'
  | 'FRAUD'
  | 'ABUSE'
  | 'OFFENSIVE_CONTENT'
  | 'SAFETY_CONCERN'
  | 'OTHER';

export type ReportStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface CreateReportRequest {
  reportedUserId: string;
  sessionId?: string;
  reason: ReportReason;
  description?: string;
}

export interface ReportResponse {
  id: string;
  reportedUserId: string;
  reportedUserName: string;
  sessionId?: string | null;
  reason: ReportReason;
  description?: string | null;
  status: ReportStatus;
  createdAt: string;
}

export interface ModerationReportDetailResponse {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  sessionId?: string | null;
  sessionSkillName?: string | null;
  reason: ReportReason;
  description?: string | null;
  status: ReportStatus;
  moderatorNotes?: string | null;
  resolvedById?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateReportStatusRequest {
  status: ReportStatus;
  moderatorNotes?: string;
}

export type DisputeReason =
  | 'SESSION_DID_NOT_HAPPEN'
  | 'SESSION_INCOMPLETE'
  | 'INAPPROPRIATE_BEHAVIOR'
  | 'TECHNICAL_ISSUE'
  | 'CREDIT_ISSUE'
  | 'MISCONDUCT'
  | 'OTHER';

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export interface CreateDisputeRequest {
  sessionId: string;
  reason: DisputeReason;
  description: string;
}

export interface DisputeResponse {
  id: string;
  sessionId: string;
  skillName?: string | null;
  createdById: string;
  createdByName: string;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  createdAt: string;
}

export interface ModerationDisputeDetailResponse {
  id: string;
  sessionId: string;
  skillName?: string | null;
  teacherId: string;
  teacherName: string;
  learnerId: string;
  learnerName: string;
  createdById: string;
  createdByName: string;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  moderatorNotes?: string | null;
  resolvedById?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDisputeStatusRequest {
  status: DisputeStatus;
  moderatorNotes?: string;
}

export interface ApiErrorResponse {
  timestamp?: string;
  status: number;
  error: string;
  message: string;
  path?: string;
  validationErrors?: Record<string, string>;
}

export class ApiClientError extends Error {
  public status: number;
  public error: string;
  public validationErrors?: Record<string, string>;
  public path?: string;

  constructor(errorResponse: ApiErrorResponse) {
    super(errorResponse.message || 'An error occurred with the API request');
    this.name = 'ApiClientError';
    this.status = errorResponse.status;
    this.error = errorResponse.error;
    this.validationErrors = errorResponse.validationErrors;
    this.path = errorResponse.path;
  }
}

// Phase 11: Notifications & Activity Center Types
export type NotificationType =
  | 'EXCHANGE_REQUEST_RECEIVED'
  | 'EXCHANGE_REQUEST_ACCEPTED'
  | 'EXCHANGE_REQUEST_REJECTED'
  | 'SESSION_CREATED'
  | 'SESSION_STARTED'
  | 'SESSION_COMPLETED'
  | 'SESSION_SCHEDULED'
  | 'SESSION_RESCHEDULED'
  | 'SESSION_REMINDER'
  | 'NEW_MESSAGE'
  | 'REVIEW_RECEIVED'
  | 'DISPUTE_UPDATED'
  | 'SAFETY_UPDATE';

export interface NotificationResponse {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
  createdAt: string;
  readAt?: string | null;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationPreferenceResponse {
  id: string;
  userId: string;
  exchangeRequests: boolean;
  sessions: boolean;
  messages: boolean;
  reviews: boolean;
  safety: boolean;
  updatedAt: string;
}

export interface UpdateNotificationPreferencesRequest {
  exchangeRequests?: boolean;
  sessions?: boolean;
  messages?: boolean;
  reviews?: boolean;
  safety?: boolean;
}

// Phase 12 Personalization & Dashboard Types
export interface MissingProfileField {
  fieldKey: string;
  label: string;
  actionUrl: string;
  weight: number;
}

export interface ProfileCompletionResponse {
  completionPercentage: number;
  isComplete: boolean;
  missingFields: MissingProfileField[];
}

export interface RecommendedSkillSummary {
  id: string;
  name: string;
  categoryName: string;
  proficiency: string;
  relationshipType: string;
}

export interface RecommendedStudentResponse {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  collegeName?: string | null;
  department?: string | null;
  yearOfStudy?: string | null;
  matchScore: number;
  teachingSkills: RecommendedSkillSummary[];
  learningSkills: RecommendedSkillSummary[];
  recommendationReasonType: string;
  recommendationReason: string;
  matchHighlights: string[];
}

export interface RecommendedSkillResponse {
  id: string;
  name: string;
  categoryId?: string | null;
  categoryName?: string | null;
  description?: string | null;
  recommendationReasonType: string;
  recommendationReason: string;
}

export interface RecentlyViewedProfileResponse {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  collegeName?: string | null;
  department?: string | null;
  yearOfStudy?: string | null;
  topSkills: string[];
  viewedAt: string;
}

export interface SearchHistoryResponse {
  id: string;
  query: string;
  categoryId?: string | null;
  categoryName?: string | null;
  skillId?: string | null;
  skillName?: string | null;
  searchedAt: string;
}

export interface RecordProfileViewRequest {
  targetUserId: string;
}

export interface RecordSearchRequest {
  query: string;
  categoryId?: string | null;
  skillId?: string | null;
}

export interface UserActivityResponse {
  id: string;
  activityType: string;
  title: string;
  description: string;
  timestamp: string;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
}

export interface RecentRequestItem {
  requestId: string;
  type: 'INCOMING' | 'OUTGOING';
  counterpartName: string;
  counterpartAvatarUrl?: string | null;
  skillName: string;
  status: string;
  createdAt: string;
}

export interface UpcomingSessionItem {
  sessionId: string;
  counterpartName: string;
  counterpartAvatarUrl?: string | null;
  skillName: string;
  role: 'TEACHER' | 'LEARNER';
  status: string;
  scheduledStartTime: string;
  durationMinutes: number;
}

export interface RequestSummary {
  incomingPendingCount: number;
  outgoingPendingCount: number;
  recentRequests: RecentRequestItem[];
}

export interface SessionSummary {
  upcomingCount: number;
  completedCount: number;
  nextSession?: UpcomingSessionItem | null;
}

export interface NotificationSummary {
  unreadCount: number;
}

export interface DashboardSummaryResponse {
  profileCompletion: ProfileCompletionResponse;
  recommendedStudents: RecommendedStudentResponse[];
  recommendedSkills: RecommendedSkillResponse[];
  requestSummary: RequestSummary;
  sessionSummary: SessionSummary;
  recentActivity: UserActivityResponse[];
  notificationSummary: NotificationSummary;
  recentlyViewed: RecentlyViewedProfileResponse[];
  recentSearches: SearchHistoryResponse[];
}

// Phase 16: Friend Requests & Peer Connection Types
export type FriendshipStatus = 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'ACCEPTED';

export interface FriendshipStatusResponse {
  status: FriendshipStatus;
  requestId?: string | null;
  conversationId?: string | null;
}

export interface FriendRequestDto {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  senderCollege?: string | null;
  receiverId: string;
  receiverName: string;
  receiverAvatarUrl?: string | null;
  receiverCollege?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface FriendSummaryDto {
  friendRequestId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  collegeName?: string | null;
  department?: string | null;
  yearOfStudy?: string | null;
  conversationId?: string | null;
  connectedAt: string;
}
// Phase 8: Smart Scheduling & Availability Types
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface UserAvailabilityResponse {
  id: string;
  userId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  timezone: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAvailabilityRequest {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  timezone?: string;
  active?: boolean;
}

export interface UpdateAvailabilityRequest {
  dayOfWeek?: DayOfWeek;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  active?: boolean;
}

export type SessionResponse = Session;

export interface SessionScheduleResponse {
  id: string;
  sessionId: string;
  startAt: string;
  endAt: string;
  timezone: string;
  status?: string;
  scheduledBy?: string;
  rescheduledCount?: number;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleSessionRequest {
  startAt: string;
  endAt: string;
  timezone?: string;
}

export interface RescheduleSessionRequest {
  startAt: string;
  endAt: string;
  timezone?: string;
  reason?: string;
}


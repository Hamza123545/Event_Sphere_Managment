# Data Model: EventSphere Management Platform

**Feature Branch**: `001-expo-management-platform`
**Created**: 2025-12-22
**Status**: Draft
**Technology**: MongoDB with Mongoose ODM, TypeScript strict mode

## Overview

This document defines the complete data model for EventSphere Management Platform, including entity schemas, relationships, validation rules, and state transitions. All schemas use Mongoose ODM with TypeScript for type safety and MongoDB for persistence.

---

## Entity Schemas

### 1. User

Represents all platform users with role-based differentiation (Admin/Organizer, Exhibitor, Attendee).

**TypeScript Interface**:

```typescript
interface IUser {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  role: 'admin' | 'organizer' | 'exhibitor' | 'attendee';
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
  };
  isEmailVerified: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  gdprConsent: {
    marketingConsent: boolean;
    dataProcessingConsent: boolean;
    consentDate: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}
```

**Mongoose Schema**:

```typescript
const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (v: string) => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v),
      message: 'Invalid email format',
    },
  },
  passwordHash: {
    type: String,
    required: true,
    select: false, // Never return password hash in queries
  },
  role: {
    type: String,
    enum: ['admin', 'organizer', 'exhibitor', 'attendee'],
    required: true,
    index: true,
  },
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: (v: string) => !v || /^\+?[\d\s\-()]+$/.test(v),
        message: 'Invalid phone number format',
      },
    },
    avatar: {
      type: String, // URL or file path
      validate: {
        validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
        message: 'Avatar must be a valid URL',
      },
    },
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
  gdprConsent: {
    marketingConsent: {
      type: Boolean,
      default: false,
    },
    dataProcessingConsent: {
      type: Boolean,
      required: true,
    },
    consentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  lastLogin: Date,
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ 'profile.firstName': 1, 'profile.lastName': 1 });
```

**Validation Rules** (from FR-001, FR-002, FR-004, FR-007):
- Email: Required, unique, valid format
- Password: Hashed with bcrypt (handled in service layer, not stored in plain text)
- Role: Required, one of ['admin', 'organizer', 'exhibitor', 'attendee']
- GDPR consent: Data processing consent required
- Password reset token: Time-limited (expires after 1 hour)

**Relationships**:
- One-to-Many with `ExpoEvent` (organizer reference)
- One-to-Many with `ExhibitorProfile` (user reference)
- One-to-Many with `AttendeeRegistration` (user reference)
- One-to-Many with `SessionBookmark` (user reference)
- One-to-Many with `Message` (sender/recipient reference)
- One-to-Many with `FeedbackSubmission` (submitter reference)

---

### 2. Expo Event

Represents a trade show or expo with complete details.

**TypeScript Interface**:

```typescript
interface IExpoEvent {
  _id: ObjectId;
  title: string;
  description: string;
  theme?: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  location: {
    venueName: string;
    address: string;
    city: string;
    state?: string;
    country: string;
    zipCode?: string;
  };
  organizer: ObjectId; // Reference to User
  status: 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled';
  floorPlan?: ObjectId; // Reference to FloorPlan
  createdAt: Date;
  updatedAt: Date;
}
```

**Mongoose Schema**:

```typescript
const ExpoEventSchema = new Schema<IExpoEvent>({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 200,
    index: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 20,
    maxlength: 5000,
  },
  theme: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  dateRange: {
    startDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(v: Date) {
          return v >= new Date();
        },
        message: 'Start date must be in the future',
      },
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(this: IExpoEvent, v: Date) {
          return v > this.dateRange.startDate;
        },
        message: 'End date must be after start date',
      },
    },
  },
  location: {
    venueName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    state: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: 20,
    },
  },
  organizer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    validate: {
      validator: async function(v: ObjectId) {
        const user = await mongoose.model('User').findById(v);
        return user && (user.role === 'organizer' || user.role === 'admin');
      },
      message: 'Organizer must have organizer or admin role',
    },
  },
  status: {
    type: String,
    enum: ['draft', 'upcoming', 'active', 'completed', 'cancelled'],
    default: 'draft',
    index: true,
  },
  floorPlan: {
    type: Schema.Types.ObjectId,
    ref: 'FloorPlan',
  },
}, {
  timestamps: true,
});

// Indexes for performance
ExpoEventSchema.index({ organizer: 1, status: 1 });
ExpoEventSchema.index({ 'dateRange.startDate': 1, 'dateRange.endDate': 1 });
ExpoEventSchema.index({ 'location.city': 1, 'location.country': 1 });
```

**Validation Rules** (from FR-008, FR-009):
- Title: Required, 5-200 characters
- Description: Required, 20-5000 characters
- Date range: Start date must be future, end date after start date
- Organizer: Required, must reference User with 'organizer' or 'admin' role
- Status: One of ['draft', 'upcoming', 'active', 'completed', 'cancelled']

**State Transitions**:
- draft → upcoming (when published)
- upcoming → active (on start date)
- active → completed (on end date)
- Any status → cancelled (organizer action)

**Relationships**:
- Many-to-One with `User` (organizer)
- One-to-One with `FloorPlan`
- One-to-Many with `ExhibitorProfile` (exhibitors registered for this expo)
- One-to-Many with `Session` (sessions scheduled for this expo)
- One-to-Many with `AttendeeRegistration`

---

### 3. Exhibitor Profile

Represents an exhibiting company with registration details.

**TypeScript Interface**:

```typescript
interface IExhibitorProfile {
  _id: ObjectId;
  user: ObjectId; // Reference to User
  expo: ObjectId; // Reference to ExpoEvent
  companyName: string;
  description: string;
  logo?: string;
  productsServices: string[];
  category: string;
  documents: {
    filename: string;
    url: string;
    uploadedAt: Date;
  }[];
  contactInfo: {
    website?: string;
    email: string;
    phone?: string;
  };
  registrationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  booth?: ObjectId; // Reference to BoothSpace
  createdAt: Date;
  updatedAt: Date;
}
```

**Mongoose Schema**:

```typescript
const ExhibitorProfileSchema = new Schema<IExhibitorProfile>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  expo: {
    type: Schema.Types.ObjectId,
    ref: 'ExpoEvent',
    required: true,
    index: true,
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 200,
    index: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 20,
    maxlength: 2000,
  },
  logo: {
    type: String, // URL or file path
    validate: {
      validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
      message: 'Logo must be a valid URL',
    },
  },
  productsServices: {
    type: [String],
    required: true,
    validate: {
      validator: (v: string[]) => v.length > 0,
      message: 'At least one product/service is required',
    },
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  documents: [{
    filename: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^https?:\/\/.+/.test(v),
        message: 'Document URL must be valid',
      },
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  contactInfo: {
    website: {
      type: String,
      trim: true,
      validate: {
        validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
        message: 'Website must be a valid URL',
      },
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v: string) => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v),
        message: 'Invalid email format',
      },
    },
    phone: {
      type: String,
      trim: true,
    },
  },
  registrationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  booth: {
    type: Schema.Types.ObjectId,
    ref: 'BoothSpace',
  },
}, {
  timestamps: true,
});

// Compound index to ensure one profile per user per expo
ExhibitorProfileSchema.index({ user: 1, expo: 1 }, { unique: true });
ExhibitorProfileSchema.index({ expo: 1, registrationStatus: 1 });
ExhibitorProfileSchema.index({ category: 1, expo: 1 });
```

**Validation Rules** (from FR-017, FR-018, FR-019):
- Company name: Required, 2-200 characters
- Description: Required, 20-2000 characters
- Products/services: At least one required
- Documents: File size limits enforced at application layer (10MB max per FR assumption)
- Email: Required, valid format
- Registration status: One of ['pending', 'approved', 'rejected']
- Unique constraint: One profile per user per expo

**State Transitions**:
- pending → approved (organizer approval, FR-011)
- pending → rejected (organizer rejection, FR-011)
- approved → booth assigned (when booth selected)

**Relationships**:
- Many-to-One with `User` (exhibitor user)
- Many-to-One with `ExpoEvent` (registered expo)
- One-to-One with `BoothSpace` (assigned booth)

---

### 4. Booth Space

Represents a physical booth location on the floor plan.

**TypeScript Interface**:

```typescript
interface IBoothSpace {
  _id: ObjectId;
  floorPlan: ObjectId; // Reference to FloorPlan
  expo: ObjectId; // Reference to ExpoEvent
  identifier: string; // e.g., "A-101", "B-205"
  size: {
    width: number; // meters
    height: number; // meters
    area: number; // square meters
  };
  location: {
    x: number; // coordinate on floor plan
    y: number; // coordinate on floor plan
  };
  amenities: string[]; // e.g., ["power", "wifi", "storage"]
  priceTier?: string; // e.g., "standard", "premium", "deluxe"
  status: 'available' | 'reserved' | 'occupied';
  exhibitor?: ObjectId; // Reference to ExhibitorProfile
  reservedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Mongoose Schema**:

```typescript
const BoothSpaceSchema = new Schema<IBoothSpace>({
  floorPlan: {
    type: Schema.Types.ObjectId,
    ref: 'FloorPlan',
    required: true,
    index: true,
  },
  expo: {
    type: Schema.Types.ObjectId,
    ref: 'ExpoEvent',
    required: true,
    index: true,
  },
  identifier: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true,
  },
  size: {
    width: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    height: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    area: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  location: {
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
  },
  amenities: {
    type: [String],
    default: [],
  },
  priceTier: {
    type: String,
    enum: ['standard', 'premium', 'deluxe'],
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'occupied'],
    default: 'available',
    index: true,
  },
  exhibitor: {
    type: Schema.Types.ObjectId,
    ref: 'ExhibitorProfile',
    validate: {
      validator: function(this: IBoothSpace, v: ObjectId) {
        // Exhibitor required when status is reserved or occupied
        if (this.status === 'reserved' || this.status === 'occupied') {
          return !!v;
        }
        return true;
      },
      message: 'Exhibitor is required when booth is reserved or occupied',
    },
  },
  reservedAt: Date,
}, {
  timestamps: true,
});

// Compound index to ensure unique booth identifiers per expo
BoothSpaceSchema.index({ expo: 1, identifier: 1 }, { unique: true });
BoothSpaceSchema.index({ floorPlan: 1, status: 1 });

// Pre-save hook to calculate area
BoothSpaceSchema.pre('save', function(next) {
  this.size.area = this.size.width * this.size.height;
  next();
});
```

**Validation Rules** (from FR-012, FR-013, FR-020, FR-021):
- Identifier: Required, unique per expo, uppercase
- Size: Width and height between 1-100m, area auto-calculated
- Status: One of ['available', 'reserved', 'occupied']
- Exhibitor: Required when status is 'reserved' or 'occupied'
- Unique constraint: One identifier per expo

**State Transitions**:
- available → reserved (exhibitor selects booth, FR-021)
- reserved → occupied (expo starts)
- reserved → available (reservation cancelled)
- occupied → available (expo ends, booth cleared)

**Edge Case Handling**:
- Concurrent reservation attempts: Use optimistic locking (version field)
- Booth change requests: Allow status transition back to available with deadline constraints

**Relationships**:
- Many-to-One with `FloorPlan`
- Many-to-One with `ExpoEvent`
- One-to-One with `ExhibitorProfile` (when occupied/reserved)

---

### 5. Session/Workshop

Represents scheduled event activities.

**TypeScript Interface**:

```typescript
interface ISession {
  _id: ObjectId;
  expo: ObjectId; // Reference to ExpoEvent
  title: string;
  description: string;
  speakers: {
    name: string;
    title?: string;
    bio?: string;
  }[];
  schedule: {
    startTime: Date;
    endTime: Date;
    duration: number; // minutes
  };
  location: {
    room: string;
    building?: string;
  };
  capacity: number;
  currentAttendees: number;
  topic: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Mongoose Schema**:

```typescript
const SessionSchema = new Schema<ISession>({
  expo: {
    type: Schema.Types.ObjectId,
    ref: 'ExpoEvent',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 200,
    index: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 20,
    maxlength: 2000,
  },
  speakers: [{
    name: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  }],
  schedule: {
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
      validate: {
        validator: function(this: ISession, v: Date) {
          return v > this.schedule.startTime;
        },
        message: 'End time must be after start time',
      },
    },
    duration: {
      type: Number,
      required: true,
      min: 15,
      max: 480, // 8 hours max
    },
  },
  location: {
    room: {
      type: String,
      required: true,
      trim: true,
    },
    building: {
      type: String,
      trim: true,
    },
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 10000,
  },
  currentAttendees: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: function(this: ISession, v: number) {
        return v <= this.capacity;
      },
      message: 'Current attendees cannot exceed capacity',
    },
  },
  topic: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes for performance
SessionSchema.index({ expo: 1, 'schedule.startTime': 1 });
SessionSchema.index({ expo: 1, category: 1 });
SessionSchema.index({ topic: 1 });

// Pre-save hook to calculate duration
SessionSchema.pre('save', function(next) {
  if (this.schedule.startTime && this.schedule.endTime) {
    const durationMs = this.schedule.endTime.getTime() - this.schedule.startTime.getTime();
    this.schedule.duration = Math.round(durationMs / 60000); // Convert to minutes
  }
  next();
});
```

**Validation Rules** (from FR-010, FR-015):
- Title: Required, 5-200 characters
- Description: Required, 20-2000 characters
- Schedule: Start time required, end time after start, duration 15-480 minutes
- Location: Room required
- Capacity: 1-10,000 attendees
- Current attendees: Cannot exceed capacity

**Edge Case Handling**:
- Scheduling conflicts: Validate no overlapping sessions in same room (application layer)
- Capacity management: Track currentAttendees, prevent overbooking
- Session modifications: Trigger real-time notifications (FR-034)

**Relationships**:
- Many-to-One with `ExpoEvent`
- One-to-Many with `SessionBookmark` (attendee bookmarks)

---

### 6. Floor Plan

Represents the physical layout of an expo.

**TypeScript Interface**:

```typescript
interface IFloorPlan {
  _id: ObjectId;
  expo: ObjectId; // Reference to ExpoEvent
  name: string;
  dimensions: {
    width: number; // meters
    height: number; // meters
  };
  imageUrl?: string; // Graphical representation
  metadata: {
    scale: number; // pixels per meter
    totalBooths: number;
    availableBooths: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Mongoose Schema**:

```typescript
const FloorPlanSchema = new Schema<IFloorPlan>({
  expo: {
    type: Schema.Types.ObjectId,
    ref: 'ExpoEvent',
    required: true,
    unique: true, // One floor plan per expo
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 200,
  },
  dimensions: {
    width: {
      type: Number,
      required: true,
      min: 10,
      max: 1000,
    },
    height: {
      type: Number,
      required: true,
      min: 10,
      max: 1000,
    },
  },
  imageUrl: {
    type: String,
    validate: {
      validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
      message: 'Image URL must be valid',
    },
  },
  metadata: {
    scale: {
      type: Number,
      default: 10, // 10 pixels per meter
      min: 1,
      max: 100,
    },
    totalBooths: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableBooths: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
}, {
  timestamps: true,
});
```

**Validation Rules** (from FR-012):
- Name: Required, 3-200 characters
- Dimensions: Width and height 10-1000m
- Unique constraint: One floor plan per expo

**Relationships**:
- One-to-One with `ExpoEvent`
- One-to-Many with `BoothSpace`

---

### 7. Attendee Registration

Represents attendee sign-ups for expos.

**TypeScript Interface**:

```typescript
interface IAttendeeRegistration {
  _id: ObjectId;
  user: ObjectId; // Reference to User
  expo: ObjectId; // Reference to ExpoEvent
  registrationDate: Date;
  attendanceStatus: 'registered' | 'checked-in' | 'no-show';
  preferences: {
    interests: string[];
    dietaryRestrictions?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Mongoose Schema**:

```typescript
const AttendeeRegistrationSchema = new Schema<IAttendeeRegistration>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  expo: {
    type: Schema.Types.ObjectId,
    ref: 'ExpoEvent',
    required: true,
    index: true,
  },
  registrationDate: {
    type: Date,
    default: Date.now,
    required: true,
  },
  attendanceStatus: {
    type: String,
    enum: ['registered', 'checked-in', 'no-show'],
    default: 'registered',
    index: true,
  },
  preferences: {
    interests: {
      type: [String],
      default: [],
    },
    dietaryRestrictions: {
      type: [String],
    },
  },
}, {
  timestamps: true,
});

// Compound index to ensure one registration per user per expo
AttendeeRegistrationSchema.index({ user: 1, expo: 1 }, { unique: true });
AttendeeRegistrationSchema.index({ expo: 1, attendanceStatus: 1 });
```

**Validation Rules** (from FR-027):
- User: Required
- Expo: Required
- Unique constraint: One registration per user per expo
- Attendance status: One of ['registered', 'checked-in', 'no-show']

**State Transitions**:
- registered → checked-in (attendee arrives at expo)
- registered → no-show (expo ends without check-in)

**Relationships**:
- Many-to-One with `User` (attendee)
- Many-to-One with `ExpoEvent`

---

### 8. Session Bookmark

Represents attendee interest in sessions.

**TypeScript Interface**:

```typescript
interface ISessionBookmark {
  _id: ObjectId;
  user: ObjectId; // Reference to User
  session: ObjectId; // Reference to Session
  bookmarkDate: Date;
  reminderPreferences: {
    enabled: boolean;
    minutesBefore: number; // e.g., 60 for 1 hour before
    channels: ('email' | 'in-app')[];
  };
  attended: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Mongoose Schema**:

```typescript
const SessionBookmarkSchema = new Schema<ISessionBookmark>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  session: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true,
  },
  bookmarkDate: {
    type: Date,
    default: Date.now,
    required: true,
  },
  reminderPreferences: {
    enabled: {
      type: Boolean,
      default: true,
    },
    minutesBefore: {
      type: Number,
      default: 60,
      min: 5,
      max: 1440, // Max 24 hours before
    },
    channels: {
      type: [String],
      enum: ['email', 'in-app'],
      default: ['email', 'in-app'],
    },
  },
  attended: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Compound index to ensure one bookmark per user per session
SessionBookmarkSchema.index({ user: 1, session: 1 }, { unique: true });
SessionBookmarkSchema.index({ session: 1, attended: 1 });
```

**Validation Rules** (from FR-031, FR-032, FR-033):
- User: Required
- Session: Required
- Unique constraint: One bookmark per user per session
- Reminder: 5 minutes to 24 hours before session

**Edge Case Handling**:
- Scheduling conflicts: Allow multiple bookmarks, warn user (application layer)
- Session cancellation: Notify all bookmarked users

**Relationships**:
- Many-to-One with `User` (attendee)
- Many-to-One with `Session`

---

### 9. Message

Represents communication between users.

**TypeScript Interface**:

```typescript
interface IMessage {
  _id: ObjectId;
  sender: ObjectId; // Reference to User
  recipient: ObjectId; // Reference to User
  subject?: string;
  content: string;
  context: 'general-inquiry' | 'exhibitor-collaboration' | 'support-request' | 'organizer-communication';
  relatedExpo?: ObjectId; // Reference to ExpoEvent
  timestamp: Date;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Mongoose Schema**:

```typescript
const MessageSchema = new Schema<IMessage>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  subject: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 5000,
  },
  context: {
    type: String,
    enum: ['general-inquiry', 'exhibitor-collaboration', 'support-request', 'organizer-communication'],
    required: true,
    index: true,
  },
  relatedExpo: {
    type: Schema.Types.ObjectId,
    ref: 'ExpoEvent',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true,
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: Date,
}, {
  timestamps: true,
});

// Indexes for performance
MessageSchema.index({ recipient: 1, isRead: 1, timestamp: -1 });
MessageSchema.index({ sender: 1, timestamp: -1 });
MessageSchema.index({ relatedExpo: 1, context: 1 });
```

**Validation Rules** (from FR-023, FR-024, FR-030):
- Sender and recipient: Required
- Content: Required, 1-5000 characters
- Context: One of defined enum values

**Relationships**:
- Many-to-One with `User` (sender)
- Many-to-One with `User` (recipient)
- Many-to-One with `ExpoEvent` (optional context)

---

### 10. Analytics Data

Represents aggregated metrics for reporting.

**TypeScript Interface**:

```typescript
interface IAnalyticsData {
  _id: ObjectId;
  expo: ObjectId; // Reference to ExpoEvent
  metricType: 'attendee-count' | 'session-popularity' | 'booth-traffic' | 'engagement-rate';
  timePeriod: {
    start: Date;
    end: Date;
  };
  metrics: {
    [key: string]: number | string;
  };
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Mongoose Schema**:

```typescript
const AnalyticsDataSchema = new Schema<IAnalyticsData>({
  expo: {
    type: Schema.Types.ObjectId,
    ref: 'ExpoEvent',
    required: true,
    index: true,
  },
  metricType: {
    type: String,
    enum: ['attendee-count', 'session-popularity', 'booth-traffic', 'engagement-rate'],
    required: true,
    index: true,
  },
  timePeriod: {
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
      validate: {
        validator: function(this: IAnalyticsData, v: Date) {
          return v > this.timePeriod.start;
        },
        message: 'End time must be after start time',
      },
    },
  },
  metrics: {
    type: Schema.Types.Mixed,
    required: true,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for performance
AnalyticsDataSchema.index({ expo: 1, metricType: 1, 'timePeriod.start': -1 });
```

**Validation Rules** (from FR-014):
- Expo: Required
- Metric type: One of defined enum values
- Time period: End after start

**Relationships**:
- Many-to-One with `ExpoEvent`

---

### 11. Feedback Submission

Represents user feedback and support requests.

**TypeScript Interface**:

```typescript
interface IFeedbackSubmission {
  _id: ObjectId;
  submitter: ObjectId; // Reference to User
  category: 'suggestion' | 'bug-report' | 'support-request';
  subject: string;
  message: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'closed';
  assignedTo?: ObjectId; // Reference to User (staff member)
  response?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Mongoose Schema**:

```typescript
const FeedbackSubmissionSchema = new Schema<IFeedbackSubmission>({
  submitter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  category: {
    type: String,
    enum: ['suggestion', 'bug-report', 'support-request'],
    required: true,
    index: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 200,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 5000,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'closed'],
    default: 'pending',
    index: true,
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  response: {
    type: String,
    trim: true,
    maxlength: 5000,
  },
}, {
  timestamps: true,
});

// Indexes for performance
FeedbackSubmissionSchema.index({ status: 1, createdAt: -1 });
FeedbackSubmissionSchema.index({ submitter: 1, category: 1 });
```

**Validation Rules** (from FR-037, FR-038, FR-039):
- Submitter: Required
- Category: One of ['suggestion', 'bug-report', 'support-request']
- Subject: Required, 5-200 characters
- Message: Required, 10-5000 characters
- Status: One of ['pending', 'reviewed', 'resolved', 'closed']

**State Transitions**:
- pending → reviewed (staff views submission)
- reviewed → resolved (staff provides response)
- resolved → closed (submitter acknowledges or auto-close after 7 days)

**Relationships**:
- Many-to-One with `User` (submitter)
- Many-to-One with `User` (assigned staff, optional)

---

## Relationship Summary

```
User (1) ─────────> (*) ExpoEvent (organizer reference)
User (1) ─────────> (*) ExhibitorProfile
User (1) ─────────> (*) AttendeeRegistration
User (1) ─────────> (*) SessionBookmark
User (1) ─────────> (*) Message (sender)
User (1) ─────────> (*) Message (recipient)
User (1) ─────────> (*) FeedbackSubmission

ExpoEvent (1) ────> (1) FloorPlan
ExpoEvent (1) ────> (*) ExhibitorProfile
ExpoEvent (1) ────> (*) Session
ExpoEvent (1) ────> (*) AttendeeRegistration
ExpoEvent (1) ────> (*) BoothSpace
ExpoEvent (1) ────> (*) AnalyticsData

FloorPlan (1) ────> (*) BoothSpace

BoothSpace (1) ───> (1) ExhibitorProfile (when reserved/occupied)

Session (1) ──────> (*) SessionBookmark

ExhibitorProfile (1) > (1) BoothSpace (optional, when booth assigned)
```

---

## State Machines

### Expo Event Status

```
draft ───> upcoming ───> active ───> completed
  │                        │
  └───> cancelled <────────┘
```

### Booth Space Status

```
available ───> reserved ───> occupied
    ^            │              │
    └────────────┴──────────────┘
         (cancellation / expo end)
```

### Exhibitor Registration Status

```
pending ───> approved ───> booth assigned
   │
   └───> rejected
```

### Feedback Submission Status

```
pending ───> reviewed ───> resolved ───> closed
```

---

## Indexing Strategy

**High-Priority Indexes** (for performance):
- User: email (unique), role
- ExpoEvent: organizer + status, dateRange, location
- ExhibitorProfile: user + expo (unique compound), expo + registrationStatus, category + expo
- BoothSpace: expo + identifier (unique compound), floorPlan + status
- Session: expo + startTime, expo + category
- AttendeeRegistration: user + expo (unique compound), expo + attendanceStatus
- SessionBookmark: user + session (unique compound)
- Message: recipient + isRead + timestamp, sender + timestamp
- FeedbackSubmission: status + createdAt

**Rationale**:
- Compound unique indexes prevent duplicate registrations/bookmarks
- Status + timestamp indexes optimize queue/list queries
- Foreign key indexes optimize JOIN-equivalent aggregations
- Text indexes on searchable fields (companyName, title) for search functionality

---

## Validation Summary

All schemas enforce:
- ✅ Required fields (FR compliance)
- ✅ Data types with TypeScript strict mode
- ✅ String length constraints (min/max)
- ✅ Enum validation for status fields
- ✅ Email format validation
- ✅ URL format validation
- ✅ Date range validation (end > start)
- ✅ Unique constraints (compound indexes)
- ✅ Cross-field validation (e.g., currentAttendees <= capacity)
- ✅ Role-based constraints (e.g., organizer must have organizer/admin role)

---

## Next Steps

1. **Generate API contracts** - Create OpenAPI/YAML specifications for REST endpoints based on entities
2. **Create quickstart guide** - Document setup instructions for MongoDB, Mongoose initialization, and seed data
3. **Generate tasks** - Use `/sp.tasks` to create implementation tasks based on data model

---

**Data Model Completed**: 2025-12-22
**All Entities Defined**: Ready for API contract generation

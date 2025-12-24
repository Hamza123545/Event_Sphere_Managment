/**
 * Approval-related types
 * For exhibitor application approval/rejection workflow
 */

export interface ExhibitorApplication {
  profileId: string;
  userId: string;
  expoId: string;
  companyName: string;
  description: string;
  logo?: string;
  productsServices: string[];
  category: string;
  documents: {
    filename: string;
    url: string;
    uploadedAt: string;
  }[];
  contactInfo: {
    website?: string;
    email: string;
    phone?: string;
  };
  registrationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListApplicationsResponse {
  success: boolean;
  data: {
    applications: ExhibitorApplication[];
  };
}

export interface ApproveExhibitorResponse {
  success: boolean;
  message: string;
  data: ExhibitorApplication;
}

export interface RejectExhibitorRequest {
  reason: string;
}

export interface RejectExhibitorResponse {
  success: boolean;
  message: string;
  data: ExhibitorApplication;
}

export interface ExhibitorApprovedEvent {
  type: 'exhibitor-approved';
  profileId: string;
  exhibitorProfileId: string;
  expoId: string;
  expoTitle: string;
  timestamp: string;
}

export interface ExhibitorRejectedEvent {
  type: 'exhibitor-rejected';
  profileId: string;
  exhibitorProfileId: string;
  expoId: string;
  expoTitle: string;
  reason: string;
  timestamp: string;
}


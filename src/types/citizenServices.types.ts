export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  image_url?: string | null;
  display_order?: number;
  department_type?: string;
  responsible_office_name?: string;
  office_address?: string;
  contact_number?: string;
  official_contact?: string;
  official_portal_url?: string;
  instructions?: string;
  emergency_contact?: string;
  is_sensitive?: boolean;
  total_services?: number;
  services_count?: number;
  services?: Service[];
}

export interface Service {
  id: number;
  department_id: number;
  name: string;
  code?: string;
  service_type?: 'online_application' | 'offline_guidance' | 'information' | 'complaint' | 'representation' | string;
  short_description?: string;
  detailed_guidance?: string;
  eligibility?: string;
  required_documents?: string[];
  estimated_processing_days?: number;
  official_portal_url?: string;
  accepts_online_requests?: boolean;
  accepts_complaints?: boolean;
  is_sensitive?: boolean;
  display_order?: number;
}

export interface SubmissionAttachment {
  id: number;
  file_url: string;
  file_name: string;
  file_type?: 'image' | 'video' | 'document' | 'pdf' | string;
}

export interface SubmissionAction {
  id: number;
  submission_id?: number;
  previous_status?: string | null;
  new_status?: string | null;
  action_type?: string;
  description: string;
  performed_by_name?: string;
  performed_by_role?: string;
  is_citizen_visible?: boolean;
  created_at: string;
}

export interface Submission {
  id: number;
  reference_number: string;
  citizen_name: string;
  citizen_mobile: string;
  department_id: number;
  service_id?: number | null;
  submission_type: string;
  subject: string;
  description: string;
  village: string;
  taluka?: string;
  district?: string;
  status:
    | 'received'
    | 'under_review'
    | 'assigned'
    | 'forwarded'
    | 'follow_up'
    | 'resolved'
    | 'closed'
    | 'rejected'
    | 'more_info_required'
    | 'reopened'
    | string;
  priority?: string;
  is_sensitive?: boolean;
  first_update_due_at?: string;
  first_update_sent_at?: string | null;
  sla_status?: 'pending' | 'met' | 'breached' | string;
  citizen_visible_remarks?: string | null;
  created_at: string;
  department?: Department;
  service?: Service;
  assignedOfficer?: {
    name: string;
    designation: string;
    contact_number?: string;
    phone?: string;
  };
  attachments?: SubmissionAttachment[];
  actions?: SubmissionAction[];
}

export interface CreateSubmissionInput {
  department_id: number;
  service_id?: number | null;
  submission_type?: 'complaint' | 'application' | 'query' | string;
  citizen_name: string;
  citizen_mobile: string;
  village: string;
  subject: string;
  description: string;
  reference_application_number?: string;
  device_token?: string;
  attachments?: string[];
}

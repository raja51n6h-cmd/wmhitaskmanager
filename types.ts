
export enum JobStatus {
  NEW_JOB = 'New Job',
  SURVEY_BOOKED = 'Survey Booked',
  QUOTED = 'Quoted',
  SCHEDULED = 'Scheduled',
  IN_PROGRESS = 'In Progress',
  SNAGGING = 'Snagging',
  COMPLETED = 'Completed',
  INVOICED = 'Invoiced',
  CANCELLED = 'Cancelled'
}

export const JOB_STAGES = [
  'Start Date Agreed', 'Foundations', 'DPC', 'Brickwork',
  'Roof', 'Steels', 'Glazing', 'First Fix', 'Plaster',
  'Second Fix', 'Kitchen Installation', 'Bathroom Installation',
  'Flooring Installation', 'Snags', 'Complete', 'Inspection',
  'Ground floor', 'Plumbing', 'Painting'
] as const;

export type JobStage = typeof JOB_STAGES[number];

export interface User {
  id: string;
  name: string;
  email: string; // Added for login
  role: 'Admin' | 'Site Manager' | 'Builder' | 'Surveyor' | 'Electrician' | 'Plumber';
  avatar: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  type: 'text' | 'image' | 'system';
  imageUrl?: string;
}

export interface Note {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
}

export interface Job {
  id: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  address: string;
  type: 'Garage Conversion' | 'Extension' | 'Renovation' | 'Roofing' | 'Garden Room';
  status: JobStatus;
  startDate?: string;
  finishDate?: string;
  value: number;
  assignedTeam: string[]; // Keep for generic assignment
  messages: Message[];
  description: string;
  nextAction?: string;

  // New Detailed Fields
  projectManager?: string; // Name
  builder?: string;      // Name
  electrician?: string;  // Name
  plumber?: string;      // Name
  architect?: string;    // Name

  architectPlans?: string[]; // List of file names/urls
  structuralCalculations?: string[]; // List of file names/urls

  currentStage?: JobStage;
  
  buildingControlRef?: string;
  // siteDiary removed in favor of siteNotes
  siteNotes: Note[];
  agreedExtras?: string;

  photographyWaiver?: string; // URL or boolean indicator
  liabilityForm?: string;
  pointCountForm?: string;
  glazingForm?: string;

  galleryImages: string[];
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export enum TaskStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed'
}

export interface TaskActivity {
  id: string;
  userId: string;
  type: 'creation' | 'status_change' | 'priority_change' | 'update' | 'upload' | 'comment';
  details: string;
  timestamp: Date;
}

export interface TaskAttachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  url: string; // Mock URL or Base64
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string; // User ID
  assignedBy: string; // User ID
  projectId?: string; // Optional Job ID
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // ISO Date string
  createdAt: Date;
  
  // New Fields
  activityLog: TaskActivity[];
  attachments: TaskAttachment[];
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  JOBS = 'JOBS',
  MESSAGES = 'MESSAGES',
  TASKS = 'TASKS',
  TEAM = 'TEAM',
  SETTINGS = 'SETTINGS'
}

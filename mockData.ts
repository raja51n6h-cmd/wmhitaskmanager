
import { Job, JobStatus, User, Task, TaskPriority, TaskStatus } from './types';

export const USERS: User[] = [
  { id: 'u1', name: 'Sarah (Office)', email: 'sarah@wmhi.co.uk', role: 'Admin', avatar: 'https://i.pravatar.cc/150?u=sarah' },
  { id: 'u2', name: 'Mike (Site Mgr)', email: 'mike@wmhi.co.uk', role: 'Site Manager', avatar: 'https://i.pravatar.cc/150?u=mike' },
  { id: 'u3', name: 'Dave (Builder)', email: 'dave@wmhi.co.uk', role: 'Builder', avatar: 'https://i.pravatar.cc/150?u=dave' },
  { id: 'u4', name: 'Tom (Surveyor)', email: 'tom@wmhi.co.uk', role: 'Surveyor', avatar: 'https://i.pravatar.cc/150?u=tom' },
  { id: 'u5', name: 'Steve (Sparks)', email: 'steve@wmhi.co.uk', role: 'Electrician', avatar: 'https://i.pravatar.cc/150?u=steve' },
  { id: 'u6', name: 'Pete (Plumber)', email: 'pete@wmhi.co.uk', role: 'Plumber', avatar: 'https://i.pravatar.cc/150?u=pete' },
];

export const INITIAL_JOBS: Job[] = [
  {
    id: 'j1',
    clientName: 'Mr. & Mrs. Thompson',
    clientPhone: '07700 900123',
    clientEmail: 'thompson@example.com',
    address: '14 Oak Avenue, Solihull',
    type: 'Garage Conversion',
    status: JobStatus.IN_PROGRESS,
    currentStage: 'First Fix',
    value: 12500,
    startDate: '2023-10-15',
    finishDate: '2023-11-20',
    assignedTeam: ['u2', 'u3'],
    projectManager: 'Mike (Site Mgr)',
    builder: 'Dave (Builder)',
    electrician: 'Steve (Sparks)',
    plumber: 'Pete (Plumber)',
    architect: 'PlanRight Design',
    architectPlans: ['GroundFloor_v2.pdf', 'Electrical_Layout.pdf'],
    structuralCalculations: ['Steel_Beam_Calcs.pdf'],
    buildingControlRef: 'BIRM-23-445',
    siteNotes: [
        {
            id: 'n1',
            userId: 'u2',
            content: 'Day 12: First fix electrics mostly done. Waiting on inspector.',
            timestamp: new Date(Date.now() - 86400000)
        }
    ],
    agreedExtras: 'Extra double socket in utility room (£150).',
    description: 'Single garage conversion to home office with utility room.',
    nextAction: 'First fix electrics inspection',
    galleryImages: [
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=300&h=200',
        'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=300&h=200'
    ],
    messages: [
      { id: 'm1', senderId: 'u1', text: 'Job started correctly? Client asked about skip placement.', timestamp: new Date(Date.now() - 86400000 * 2), type: 'text' },
      { id: 'm2', senderId: 'u2', text: 'All good. Skip is on the drive. Strip out complete.', timestamp: new Date(Date.now() - 86400000 * 1.8), type: 'text' },
      { id: 'm3', senderId: 'u2', text: 'Found some damp in the rear wall, taking a photo now.', timestamp: new Date(Date.now() - 3600000), type: 'text' },
      { id: 'm4', senderId: 'u2', text: 'Need to order extra damp proof membrane.', timestamp: new Date(Date.now() - 3500000), type: 'text' },
    ]
  },
  {
    id: 'j2',
    clientName: 'Dr. Arshad',
    clientPhone: '07700 900456',
    clientEmail: 'arshad@example.com',
    address: '55 Kings Heath Rd, Birmingham',
    type: 'Extension',
    status: JobStatus.SCHEDULED,
    currentStage: 'Start Date Agreed',
    value: 45000,
    startDate: '2023-11-01',
    assignedTeam: ['u2'],
    projectManager: 'Mike (Site Mgr)',
    architect: 'Urban Extensions Ltd',
    architectPlans: ['Full_Set_A1.pdf'],
    description: 'Rear single-storey extension with bi-fold doors.',
    nextAction: 'Confirm brick match',
    galleryImages: [],
    siteNotes: [],
    messages: [
      { id: 'm1', senderId: 'u1', text: 'Planning permission finally approved! Docs uploaded.', timestamp: new Date(Date.now() - 86400000 * 5), type: 'system' },
      { id: 'm2', senderId: 'u1', text: 'Mike, can you check the brick samples on Monday?', timestamp: new Date(Date.now() - 86400000 * 4), type: 'text' },
    ]
  },
  {
    id: 'j3',
    clientName: 'Helen Smith',
    clientPhone: '07700 900789',
    clientEmail: 'h.smith@example.com',
    address: '88 High St, Sutton Coldfield',
    type: 'Renovation',
    status: JobStatus.NEW_JOB,
    value: 22000,
    assignedTeam: [],
    description: 'Full kitchen renovation and knock-through.',
    nextAction: 'Book initial survey',
    galleryImages: [],
    siteNotes: [],
    messages: []
  },
  {
    id: 'j4',
    clientName: 'James West',
    clientPhone: '07700 900321',
    address: '22b Warwick Rd, Coventry',
    type: 'Garden Room',
    status: JobStatus.COMPLETED,
    currentStage: 'Complete',
    value: 18000,
    startDate: '2023-09-01',
    // Set finish date to today so it appears in default dashboard metrics
    finishDate: new Date().toISOString().split('T')[0],
    assignedTeam: ['u3'],
    builder: 'Dave (Builder)',
    description: 'Insulated garden room 4x3m.',
    nextAction: 'Final invoice pending',
    galleryImages: [
        'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&q=80&w=300&h=200'
    ],
    siteNotes: [
        {
            id: 'n1',
            userId: 'u3',
            content: 'Client extremely happy with the cedar cladding finish.',
            timestamp: new Date(Date.now() - 86400000 * 10)
        }
    ],
    messages: [
      { id: 'm1', senderId: 'u3', text: 'Keys handed over. Customer happy.', timestamp: new Date(Date.now() - 86400000 * 10), type: 'text' }
    ]
  },
  {
    id: 'j5',
    clientName: 'Cancelled Client',
    clientPhone: '07700 000000',
    address: '99 Null Avenue, Dudley',
    type: 'Renovation',
    status: JobStatus.CANCELLED,
    value: 5000,
    assignedTeam: [],
    description: 'Cancelled due to budget constraints.',
    galleryImages: [],
    siteNotes: [],
    messages: []
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Order Skips',
    description: 'Need two 8-yard skips for the Solihull job.',
    assignedTo: 'u1', // Sarah
    assignedBy: 'u2', // Mike
    projectId: 'j1',
    status: TaskStatus.PENDING,
    priority: TaskPriority.HIGH,
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    createdAt: new Date(),
    activityLog: [
      { id: 'al1', userId: 'u2', type: 'creation', details: 'Task created', timestamp: new Date(Date.now() - 86400000) }
    ],
    attachments: []
  },
  {
    id: 't2',
    title: 'Update Risk Assessment',
    description: 'Annual review of site safety docs.',
    assignedTo: 'u1', // Sarah (Self)
    assignedBy: 'u1', // Sarah
    projectId: undefined,
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    createdAt: new Date(),
    activityLog: [
      { id: 'al1', userId: 'u1', type: 'creation', details: 'Task created', timestamp: new Date(Date.now() - 86400000 * 2) },
      { id: 'al2', userId: 'u1', type: 'status_change', details: 'Changed status to In Progress', timestamp: new Date(Date.now() - 86400000) }
    ],
    attachments: []
  },
  {
    id: 't3',
    title: 'Check Foundations',
    description: 'Inspector coming Tuesday at 10am.',
    assignedTo: 'u2', // Mike
    assignedBy: 'u1', // Sarah
    projectId: 'j2',
    status: TaskStatus.PENDING,
    priority: TaskPriority.URGENT,
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    createdAt: new Date(),
    activityLog: [
      { id: 'al1', userId: 'u1', type: 'creation', details: 'Task created', timestamp: new Date(Date.now() - 43200000) }
    ],
    attachments: []
  }
];

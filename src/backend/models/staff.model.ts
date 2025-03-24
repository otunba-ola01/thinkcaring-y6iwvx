import { UUID, ISO8601Date, Timestamp, StatusType, ContactInfo, AuditableEntity } from '../types/common.types';
import { ServiceType } from '../types/services.types';

/**
 * Interface defining the structure of a staff member entity
 */
export interface Staff {
  id: UUID;
  firstName: string;
  lastName: string;
  email: string;
  title: string | null;
  employeeId: string | null;
  hireDate: ISO8601Date | null;
  terminationDate: ISO8601Date | null;
  contactInfo: ContactInfo;
  status: StatusType;
}

/**
 * Interface defining the structure of a staff qualification
 */
export interface StaffQualification {
  id: UUID;
  staffId: UUID;
  serviceTypeId: UUID;
  serviceTypeName: string;
  effectiveDate: ISO8601Date;
  expirationDate: ISO8601Date | null;
  certificationNumber: string | null;
  notes: string | null;
}

/**
 * Interface defining the structure of a staff program assignment
 */
export interface StaffProgramAssignment {
  id: UUID;
  staffId: UUID;
  programId: UUID;
  programName: string;
  startDate: ISO8601Date;
  endDate: ISO8601Date | null;
  isPrimary: boolean;
}

/**
 * Interface for filtering staff in queries
 */
export interface StaffFilterParams {
  status?: StatusType;
  programId?: UUID;
  facilityId?: UUID;
  serviceTypeId?: UUID;
  search?: string;
}

/**
 * Interface for lightweight staff summary data used in dropdowns and references
 */
export interface StaffSummary {
  id: UUID;
  firstName: string;
  lastName: string;
  fullName: string;
  title: string | null;
  status: StatusType;
}

/**
 * Model class representing a staff member in the system with methods for staff operations
 */
export class StaffModel implements Staff, AuditableEntity {
  id: UUID;
  firstName: string;
  lastName: string;
  email: string;
  title: string | null;
  employeeId: string | null;
  hireDate: ISO8601Date | null;
  terminationDate: ISO8601Date | null;
  contactInfo: ContactInfo;
  status: StatusType;
  qualifications: StaffQualification[];
  programAssignments: StaffProgramAssignment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: UUID | null;
  updatedBy: UUID | null;

  /**
   * Creates a new StaffModel instance
   * @param staffData Staff data object
   */
  constructor(staffData: Staff) {
    this.id = staffData.id;
    this.firstName = staffData.firstName;
    this.lastName = staffData.lastName;
    this.email = staffData.email;
    this.title = staffData.title;
    this.employeeId = staffData.employeeId;
    this.hireDate = staffData.hireDate;
    this.terminationDate = staffData.terminationDate;
    this.contactInfo = staffData.contactInfo;
    this.status = staffData.status;
    
    // Initialize arrays for related entities
    this.qualifications = [];
    this.programAssignments = [];
    
    // Initialize audit fields
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.createdBy = null;
    this.updatedBy = null;
  }

  /**
   * Gets the staff member's full name
   * @returns The staff member's full name (firstName + lastName)
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Checks if the staff member is active
   * @returns True if the staff status is ACTIVE
   */
  isActive(): boolean {
    return this.status === StatusType.ACTIVE;
  }

  /**
   * Checks if the staff member is qualified for a specific service type
   * @param serviceTypeId The service type ID to check
   * @returns True if the staff has a qualification for the service type
   */
  isQualifiedForServiceType(serviceTypeId: UUID): boolean {
    if (!this.qualifications || this.qualifications.length === 0) {
      return false;
    }

    return this.qualifications.some(qualification => {
      // Check if qualification exists, is for the requested service type, and is not expired
      const isMatch = qualification.serviceTypeId === serviceTypeId;
      const isExpired = qualification.expirationDate 
        ? new Date(qualification.expirationDate) < new Date() 
        : false;
      
      return isMatch && !isExpired;
    });
  }

  /**
   * Checks if the staff member is assigned to a specific program
   * @param programId The program ID to check
   * @returns True if the staff is assigned to the program
   */
  isAssignedToProgram(programId: UUID): boolean {
    if (!this.programAssignments || this.programAssignments.length === 0) {
      return false;
    }

    return this.programAssignments.some(assignment => {
      // Check if assignment exists, is for the requested program, and is not ended
      const isMatch = assignment.programId === programId;
      const isEnded = assignment.endDate 
        ? new Date(assignment.endDate) < new Date() 
        : false;
      
      return isMatch && !isEnded;
    });
  }

  /**
   * Adds a qualification to the staff member
   * @param qualificationData The qualification data to add
   * @param updatedBy ID of the user making the update (optional)
   * @returns Promise resolving to true if qualification was added successfully
   */
  async addQualification(qualificationData: Omit<StaffQualification, 'id' | 'staffId'>, updatedBy: UUID | null = null): Promise<boolean> {
    // This would be implemented in the repository/service layer
    // Here we just simulate the operation
    return new Promise((resolve) => {
      // Add the qualification to the staff member's qualifications
      const qualification: StaffQualification = {
        id: 'new-qualification-id' as UUID, // This would be generated by the repository
        staffId: this.id,
        ...qualificationData
      };
      
      this.qualifications.push(qualification);
      this.updatedAt = new Date();
      this.updatedBy = updatedBy;
      
      resolve(true);
    });
  }

  /**
   * Removes a qualification from the staff member
   * @param qualificationId The ID of the qualification to remove
   * @returns Promise resolving to true if qualification was removed successfully
   */
  async removeQualification(qualificationId: UUID): Promise<boolean> {
    // This would be implemented in the repository/service layer
    // Here we just simulate the operation
    return new Promise((resolve) => {
      const initialLength = this.qualifications.length;
      this.qualifications = this.qualifications.filter(q => q.id !== qualificationId);
      
      const wasRemoved = initialLength > this.qualifications.length;
      if (wasRemoved) {
        this.updatedAt = new Date();
      }
      
      resolve(wasRemoved);
    });
  }

  /**
   * Assigns the staff member to a program
   * @param programId The ID of the program to assign
   * @param updatedBy ID of the user making the update (optional)
   * @returns Promise resolving to true if assignment was successful
   */
  async assignToProgram(programId: UUID, updatedBy: UUID | null = null): Promise<boolean> {
    // This would be implemented in the repository/service layer
    // Here we just simulate the operation
    return new Promise((resolve) => {
      // Check if already assigned to this program
      if (this.isAssignedToProgram(programId)) {
        resolve(false);
        return;
      }
      
      // Create a new program assignment
      const assignment: StaffProgramAssignment = {
        id: 'new-assignment-id' as UUID, // This would be generated by the repository
        staffId: this.id,
        programId: programId,
        programName: 'Program Name', // This would be fetched from the database
        startDate: new Date().toISOString() as ISO8601Date,
        endDate: null,
        isPrimary: false
      };
      
      this.programAssignments.push(assignment);
      this.updatedAt = new Date();
      this.updatedBy = updatedBy;
      
      resolve(true);
    });
  }

  /**
   * Removes the staff member from a program
   * @param programId The ID of the program to remove
   * @returns Promise resolving to true if removal was successful
   */
  async removeFromProgram(programId: UUID): Promise<boolean> {
    // This would be implemented in the repository/service layer
    // Here we just simulate the operation by setting an end date
    return new Promise((resolve) => {
      let wasUpdated = false;
      
      this.programAssignments = this.programAssignments.map(assignment => {
        if (assignment.programId === programId && !assignment.endDate) {
          wasUpdated = true;
          return {
            ...assignment,
            endDate: new Date().toISOString() as ISO8601Date
          };
        }
        return assignment;
      });
      
      if (wasUpdated) {
        this.updatedAt = new Date();
      }
      
      resolve(wasUpdated);
    });
  }

  /**
   * Activates the staff member
   * @param updatedBy ID of the user making the update (optional)
   * @returns Promise resolving to true if activation was successful
   */
  async activate(updatedBy: UUID | null = null): Promise<boolean> {
    // This would be implemented in the repository/service layer
    // Here we just simulate the operation
    return new Promise((resolve) => {
      if (this.status === StatusType.ACTIVE) {
        resolve(false);
        return;
      }
      
      this.status = StatusType.ACTIVE;
      this.updatedAt = new Date();
      this.updatedBy = updatedBy;
      
      resolve(true);
    });
  }

  /**
   * Deactivates the staff member
   * @param updatedBy ID of the user making the update (optional)
   * @returns Promise resolving to true if deactivation was successful
   */
  async deactivate(updatedBy: UUID | null = null): Promise<boolean> {
    // This would be implemented in the repository/service layer
    // Here we just simulate the operation
    return new Promise((resolve) => {
      if (this.status === StatusType.INACTIVE) {
        resolve(false);
        return;
      }
      
      this.status = StatusType.INACTIVE;
      this.updatedAt = new Date();
      this.updatedBy = updatedBy;
      
      resolve(true);
    });
  }

  /**
   * Checks if the staff member is available for a specific date and time
   * @param date The date to check availability for
   * @param startTime The start time to check
   * @param endTime The end time to check
   * @returns Promise resolving to true if staff is available, false otherwise
   */
  async checkAvailability(date: string, startTime: string, endTime: string): Promise<boolean> {
    // This would be implemented in the repository/service layer
    // Here we just simulate the operation
    return new Promise((resolve) => {
      // In a real implementation, this would check against scheduled services,
      // time off records, and other availability constraints
      
      // For simulation, we'll say the staff is available
      resolve(true);
    });
  }

  /**
   * Converts the staff model to a staff summary object for client responses
   * @returns Staff summary object with basic information
   */
  toSummary(): StaffSummary {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.getFullName(),
      title: this.title,
      status: this.status
    };
  }

  /**
   * Finds a staff member by ID and returns a StaffModel instance
   * @param id The staff ID to find
   * @returns Promise resolving to StaffModel if found, null otherwise
   */
  static async findById(id: UUID): Promise<StaffModel | null> {
    // This would be implemented in the repository/service layer
    // Here we just simulate the operation
    return new Promise((resolve) => {
      // Simulate a database lookup
      // In a real implementation, this would query the database
      
      // For simulation, we'll create a mock staff
      if (id) {
        const staff: Staff = {
          id: id,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          title: 'Personal Care Aide',
          employeeId: 'EMP123',
          hireDate: '2022-01-15' as ISO8601Date,
          terminationDate: null,
          contactInfo: {
            email: 'john.doe@example.com',
            phone: '555-123-4567'
          },
          status: StatusType.ACTIVE
        };
        
        resolve(new StaffModel(staff));
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Finds a staff member by email and returns a StaffModel instance
   * @param email The email to find
   * @returns Promise resolving to StaffModel if found, null otherwise
   */
  static async findByEmail(email: string): Promise<StaffModel | null> {
    // This would be implemented in the repository/service layer
    // Here we just simulate the operation
    return new Promise((resolve) => {
      // Simulate a database lookup
      // In a real implementation, this would query the database
      
      // For simulation, we'll create a mock staff
      if (email === 'john.doe@example.com') {
        const staff: Staff = {
          id: 'staff-id' as UUID,
          firstName: 'John',
          lastName: 'Doe',
          email: email,
          title: 'Personal Care Aide',
          employeeId: 'EMP123',
          hireDate: '2022-01-15' as ISO8601Date,
          terminationDate: null,
          contactInfo: {
            email: email,
            phone: '555-123-4567'
          },
          status: StatusType.ACTIVE
        };
        
        resolve(new StaffModel(staff));
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Finds a staff member with qualifications by ID
   * @param id The staff ID to find
   * @returns Promise resolving to StaffModel with qualifications if found, null otherwise
   */
  static async findWithQualifications(id: UUID): Promise<StaffModel | null> {
    // This would be implemented in the repository/service layer
    // Here we just simulate the operation
    return new Promise((resolve) => {
      // First find the staff member
      StaffModel.findById(id).then(staff => {
        if (!staff) {
          resolve(null);
          return;
        }
        
        // Add mock qualifications
        staff.qualifications = [
          {
            id: 'qual-1' as UUID,
            staffId: staff.id,
            serviceTypeId: 'service-type-1' as UUID,
            serviceTypeName: 'Personal Care',
            effectiveDate: '2022-01-20' as ISO8601Date,
            expirationDate: '2023-01-20' as ISO8601Date,
            certificationNumber: 'CERT123',
            notes: 'Initial certification'
          },
          {
            id: 'qual-2' as UUID,
            staffId: staff.id,
            serviceTypeId: 'service-type-2' as UUID,
            serviceTypeName: 'Respite',
            effectiveDate: '2022-03-15' as ISO8601Date,
            expirationDate: null,
            certificationNumber: 'CERT456',
            notes: null
          }
        ];
        
        resolve(staff);
      });
    });
  }

  /**
   * Finds a staff member with program assignments by ID
   * @param id The staff ID to find
   * @returns Promise resolving to StaffModel with program assignments if found, null otherwise
   */
  static async findWithProgramAssignments(id: UUID): Promise<StaffModel | null> {
    // This would be implemented in the repository/service layer
    // Here we just simulate the operation
    return new Promise((resolve) => {
      // First find the staff member
      StaffModel.findById(id).then(staff => {
        if (!staff) {
          resolve(null);
          return;
        }
        
        // Add mock program assignments
        staff.programAssignments = [
          {
            id: 'assign-1' as UUID,
            staffId: staff.id,
            programId: 'program-1' as UUID,
            programName: 'Residential Program',
            startDate: '2022-02-01' as ISO8601Date,
            endDate: null,
            isPrimary: true
          },
          {
            id: 'assign-2' as UUID,
            staffId: staff.id,
            programId: 'program-2' as UUID,
            programName: 'Day Services Program',
            startDate: '2022-03-15' as ISO8601Date,
            endDate: null,
            isPrimary: false
          }
        ];
        
        resolve(staff);
      });
    });
  }

  /**
   * Finds a staff member with all related details by ID
   * @param id The staff ID to find
   * @returns Promise resolving to StaffModel with all details if found, null otherwise
   */
  static async findWithDetails(id: UUID): Promise<StaffModel | null> {
    // This would be implemented in the repository/service layer
    // Here we just simulate the operation
    return new Promise((resolve) => {
      // First find the staff member
      StaffModel.findById(id).then(staff => {
        if (!staff) {
          resolve(null);
          return;
        }
        
        // Find with qualifications and program assignments
        Promise.all([
          StaffModel.findWithQualifications(id),
          StaffModel.findWithProgramAssignments(id)
        ]).then(([staffWithQuals, staffWithAssignments]) => {
          if (staffWithQuals) {
            staff.qualifications = staffWithQuals.qualifications;
          }
          
          if (staffWithAssignments) {
            staff.programAssignments = staffWithAssignments.programAssignments;
          }
          
          resolve(staff);
        });
      });
    });
  }
}

export default StaffModel;
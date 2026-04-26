import { Assignment, UserWithVehicles, VehicleWithUsers, AssignVehicleDTO } from '@/lib/types/assignment';
import { assignmentsApi } from '@/lib/api/assignments';

class AssignmentService {
  async getAllAssignments(): Promise<Assignment[]> {
    return assignmentsApi.getAllAssignments();
  }

  async getUsersWithVehicles(): Promise<UserWithVehicles[]> {
    return assignmentsApi.getUsersWithVehicles();
  }

  async getVehiclesWithUsers(): Promise<VehicleWithUsers[]> {
    return assignmentsApi.getVehiclesWithUsers();
  }

  async assign(data: AssignVehicleDTO): Promise<Assignment> {
    const assignment = await assignmentsApi.assign(data);
    return assignment;
  }

  async remove(utilisateurId: number, vehiculeId: number): Promise<void> {
    await assignmentsApi.remove(utilisateurId, vehiculeId);
  }
}

export const assignmentService = new AssignmentService();
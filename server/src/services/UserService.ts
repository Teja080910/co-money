import { AppDataSource } from '../config/db';
import { User } from '../models/User';

export class UserService {
    private userRepository = AppDataSource.getRepository(User);

    public async getAllUsers(): Promise<User[]> {
        return await this.userRepository.find();
    }

    public async getUserById(id: string): Promise<User | null> {
        return await this.userRepository.findOneBy({ id });
    }

    public async createUser(userData: Partial<User>): Promise<User> {
        const user = this.userRepository.create(userData);
        return await this.userRepository.save(user);
    }
}

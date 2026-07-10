import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
export declare class TodoService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createTodoDto: CreateTodoDto): Promise<{
        title: string;
        completed: boolean;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }>;
    findAll(): Promise<{
        title: string;
        completed: boolean;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }[]>;
    findOne(id: number): Promise<{
        title: string;
        completed: boolean;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }>;
    update(id: number, updateTodoDto: UpdateTodoDto): Promise<{
        title: string;
        completed: boolean;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }>;
    remove(id: number): Promise<{
        title: string;
        completed: boolean;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }>;
}

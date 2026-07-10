import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
export declare class TodoService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createTodoDto: CreateTodoDto): Promise<any>;
    findAll(): Promise<any>;
    findOne(id: number): Promise<any>;
    update(id: number, updateTodoDto: UpdateTodoDto): Promise<any>;
    remove(id: number): Promise<any>;
}

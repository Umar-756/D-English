import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
export declare class TodoController {
    private readonly todoService;
    constructor(todoService: TodoService);
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

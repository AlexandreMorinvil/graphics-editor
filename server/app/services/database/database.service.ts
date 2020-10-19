import { injectable } from 'inversify';
import { Collection, MongoClient, MongoClientOptions, ObjectID } from 'mongodb';
import 'reflect-metadata';
import { Drawing, MAX_NAME_LENGTH } from '@app/schema/drawing';

// CHANGE the URL for your database information
const DATABASE_URL = 'mongodb+srv://team106:secret106@cluster0.fspbf.azure.mongodb.net/integrator-project?retryWrites=true&w=majority';
const DATABASE_NAME = 'integrator-project';
const DATABASE_COLLECTION = 'drawing';

@injectable()
export class DatabaseService {
    collection: Collection<Drawing>;
    client: MongoClient;

    private options: MongoClientOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    };

    constructor() {}

    start() {
        MongoClient.connect(DATABASE_URL, this.options)
            .then((client: MongoClient) => {
                this.client = client;
                this.collection = client.db(DATABASE_NAME).collection(DATABASE_COLLECTION);
            })
            .catch(() => {
                console.error('CONNECTION ERROR. EXITING PROCESS');
                process.exit(1);
            });
    }

    closeConnection() {
        this.client.close();
    }

    async getAllDrawings(): Promise<Drawing[]> {
        try {
            const drawings: Drawing[] = await this.collection.find({}).toArray();
            return drawings;
        } catch (error) {
            throw new Error('Échec lors de la tentative de récupération de tous les dessins');
        }
    }

    async getDrawing(drawingID: string): Promise<Drawing> {
        try {
            const drawing: Drawing | null = await this.collection.findOne({ _id: new ObjectID(drawingID) });
            if (!drawing) throw new Error("Le dessin demandé n'a pas été trouvé");
            return drawing;
        } catch (error) {
            throw error;
        }
    }

    async addDrawing(drawing: Drawing): Promise<void> {
        try {
            this.validateDrawing(drawing);
            await this.collection.insertOne(drawing);
            return;
        } catch (error) {
            throw error;
        }
    }

    async deleteDrawing(drawingID: string): Promise<void> {
        try {
            this.collection.findOneAndDelete({ _id: new ObjectID(drawingID) }).then(() => {});
        } catch (error) {
            throw new Error('Échec lors de la tentative de suppression du dessin');
        }
    }

    private validateDrawing(drawing: Drawing): void {
        this.validateName(drawing.name);
        this.validateTag(drawing.tags);
    }
    private validateName(name: String): void {
        if (!(name.length > 0)) throw new Error('Les dessins doivent contenir un nom');
        if (!(name.length <= MAX_NAME_LENGTH)) throw new Error('Les noms des dessions doivent contenir moins un maximum de 50 caractères');
    }
    private validateTag(tags: string[]): void {
        if (tags.length === 0) return;
        tags.forEach((tag) => {
            if (!(tag.length > 0)) throw new Error('Les étiquettes assignées ne peuvent pas être vides');
            if (!(tag.length <= MAX_NAME_LENGTH)) throw new Error('Les étiquettes des dessions doivent contenir moins un maximum de 50 caractères');
        });
    }
}

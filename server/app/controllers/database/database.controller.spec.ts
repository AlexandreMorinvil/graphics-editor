import { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import { describe } from 'mocha';
import * as tests from 'supertest';
import { Drawing } from '../../../../common/communication/drawing';
import { DrawingToDatabase } from '../../../../common/communication/drawing-to-database';
import { Stubbed, testingContainer } from '../../../test/test-utils';
import { Application } from '../../app';
import { DatabaseService } from '../../services/database/database.service';
import { TYPES } from '../../types';

const HTTP_STATUS_CODE_NOT_FOUND = StatusCodes.NOT_FOUND;
const HTTPS_STATUS_CODE_OK = StatusCodes.OK;
const HTTPS_STATUS_CODE_CREATED = StatusCodes.CREATED;
const HTTPS_STATUS_NO_CONTENT = StatusCodes.NO_CONTENT;

const ERROR_DELETE_DRAWING = 'Échec lors de la tentative de suppression du dessin';
const ERROR_UPDATE_DRAWING = 'Échec lors de la tentative de mise à jour du dessin';
const ERROR_NO_DRAWING_FOUND = "Le dessin demandé n'a pas été trouvé";
const ERROR_GET_ALL_DRAWING = 'Échec lors de la tentative de récupération de tous les dessins';
const ERROR_ADD_DRAWING = "Échec lors de l'ajout du dessin";
const ERROR_GET_DRAWING_BY_TAG = "Échec lors de la tentative de récupération de tous les dessins ayant l'étiquettes";
const ERROR_GET_DRAWING_BY_NAME = 'Échec lors de la tentative de récupération de tous les dessins nommés';

describe('DatabaseController', () => {
    const ROUTING_GET_ALL = '/api/drawing';
    const ROUTING_POST = '/api/drawing';
    const ROUTING_GET_DRAWING_ID = '/api/drawing/:drawingId';
    const ROUTING_GET_NAME = '/api/drawing/name/:name';
    const ROUTING_GET_TAG = '/api/drawing/tag/:tag';
    const ROUTING_PATCH = '/api/drawing/:drawingId';
    const ROUTING_DELETE = '/api/drawing/:drawingId';

    let application: Express.Application;
    let databaseService: Stubbed<DatabaseService>;

    const drawing0 = new Drawing('0', 'alex', new Array<string>('tag1', 'tag2'), 'imagsource');
    const drawing1 = new DrawingToDatabase('1', 'alex', new Array<string>('tag1', 'tag2'));
    const drawing2 = new DrawingToDatabase('2', 'luca', new Array<string>('tag3', 'tag4'));

    beforeEach(async () => {
        const [container, sandbox] = await testingContainer();
        container.rebind(TYPES.DatabaseService).toConstantValue({
            getAllDrawings: sandbox.stub(),
            getDrawing: sandbox.stub(),
            getDrawingByName: sandbox.stub(),
            getDrawingByTags: sandbox.stub(),
            addDrawing: sandbox.stub(),
            updateDrawing: sandbox.stub(),
            deleteDrawing: sandbox.stub(),
        });
        application = container.get<Application>(TYPES.Application).app;
        databaseService = container.get(TYPES.DatabaseService);
    });

    it('should get all drawing from the database when routing is all drawing ', async () => {
        const allDrawing: DrawingToDatabase[] = new Array<DrawingToDatabase>(drawing1, drawing2);
        databaseService.getAllDrawings.resolves(allDrawing);

        return tests(application)
            .get(ROUTING_GET_ALL)
            .expect(HTTPS_STATUS_CODE_OK)
            .then((res: any) => {
                expect(res.body).to.deep.equal(allDrawing);
            });
    });

    it('should return an error of not find if get all drawing is failed', async () => {
        databaseService.getAllDrawings.rejects(new Error(ERROR_GET_ALL_DRAWING));
        return tests(application)
            .get(ROUTING_GET_ALL)
            .expect(HTTP_STATUS_CODE_NOT_FOUND)
            .then((res: any) => {
                expect(res.status).to.equal(HTTP_STATUS_CODE_NOT_FOUND);
            });
    });

    it('should get a drawing from the database when routing is get drawing id ', async () => {
        databaseService.getDrawing.resolves(drawing1);

        return tests(application)
            .get(ROUTING_GET_DRAWING_ID)
            .expect(HTTPS_STATUS_CODE_OK)
            .then((res: any) => {
                expect(res.body).to.deep.equal(drawing1);
            });
    });

    it('should return an error of not find if getDrawing is failed', async () => {
        databaseService.getDrawing.rejects(new Error(ERROR_NO_DRAWING_FOUND));
        return tests(application)
            .get(ROUTING_GET_DRAWING_ID)
            .expect(HTTP_STATUS_CODE_NOT_FOUND)
            .then((res: any) => {
                expect(res.status).to.equal(HTTP_STATUS_CODE_NOT_FOUND);
            });
    });

    it('should get a drawing from the database when routing is get drawing by name ', async () => {
        databaseService.getDrawingByName.resolves(drawing1);
        return tests(application)
            .get(ROUTING_GET_NAME)
            .expect(HTTPS_STATUS_CODE_OK)
            .then((res: any) => {
                expect(res.body).to.deep.equal(drawing1);
            });
    });

    it('should return an error of not find if getDrawingByName is failed', async () => {
        databaseService.getDrawingByName.rejects(new Error(ERROR_GET_DRAWING_BY_NAME));
        return tests(application)
            .get(ROUTING_GET_NAME)
            .expect(HTTP_STATUS_CODE_NOT_FOUND)
            .then((res: any) => {
                expect(res.status).to.equal(HTTP_STATUS_CODE_NOT_FOUND);
            });
    });

    it('should get a drawing from the database when routing is get drawing by tags ', async () => {
        databaseService.getDrawingByTags.resolves(drawing1);

        return tests(application)
            .get(ROUTING_GET_TAG)
            .expect(HTTPS_STATUS_CODE_OK)
            .then((res: any) => {
                expect(res.body).to.deep.equal(drawing1);
            });
    });

    it('should return an error of not find if get drawing by tag is failed', async () => {
        databaseService.getDrawingByTags.rejects(new Error(ERROR_GET_DRAWING_BY_TAG));
        return tests(application)
            .get(ROUTING_GET_TAG)
            .expect(HTTP_STATUS_CODE_NOT_FOUND)
            .then((res: any) => {
                expect(res.status).to.equal(HTTP_STATUS_CODE_NOT_FOUND);
            });
    });

    it('should return an error of not find if addDrawing is failed', async () => {
        databaseService.addDrawing.rejects(new Error(ERROR_ADD_DRAWING));
        return tests(application)
            .post(ROUTING_POST)
            .expect(HTTP_STATUS_CODE_NOT_FOUND)
            .then((res: any) => {
                expect(res.status).to.equal(HTTP_STATUS_CODE_NOT_FOUND);
            });
    });

    it('should return  status of created when adding a draw', async () => {
        databaseService.addDrawing.resolves();
        return tests(application)
            .post(ROUTING_POST)
            .send(drawing0)
            .then((res: any) => {
                expect(res.status).to.equal(HTTPS_STATUS_CODE_CREATED);
            });
    });

    it('should return an error of not find if updtateDrawing is failed', async () => {
        databaseService.updateDrawing.rejects(new Error(ERROR_UPDATE_DRAWING));
        return tests(application)
            .patch(ROUTING_PATCH)
            .expect(HTTP_STATUS_CODE_NOT_FOUND)
            .then((res: any) => {
                expect(res.status).to.equal(HTTP_STATUS_CODE_NOT_FOUND);
            });
    });

    it('should return a correct status id the drawing is update ', async () => {
        databaseService.updateDrawing.resolves();
        return tests(application)
            .patch(ROUTING_PATCH)
            .expect(HTTPS_STATUS_CODE_OK)
            .then((res: any) => {
                expect(res.status).to.equal(HTTPS_STATUS_CODE_OK);
            });
    });

    it('should return an error of not find if deleteDrawingLll is failed', async () => {
        databaseService.deleteDrawing.resolves('1');
        return tests(application)
            .delete(ROUTING_DELETE)
            .expect(HTTPS_STATUS_NO_CONTENT)
            .then((res: any) => {
                expect(res.status).to.equal(HTTPS_STATUS_NO_CONTENT);
            });
    });

    it('should return an error of not content if deleteDrawing is failed', async () => {
        databaseService.deleteDrawing.rejects(new Error(ERROR_DELETE_DRAWING));
        return tests(application)
            .delete(ROUTING_DELETE)
            .expect(HTTP_STATUS_CODE_NOT_FOUND)
            .then((res: any) => {
                expect(res.status).to.equal(HTTP_STATUS_CODE_NOT_FOUND);
            });
    });
});

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DrawingToDatabase } from '@common/communication/drawing-to-database';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const BASE_URL = 'http://localhost:3000/api/drawing/';
export const FILE_SERVER_BASE_URL = 'http://localhost:3000/files/';

@Injectable({
    providedIn: 'root',
})
export class ApiDrawingService {
    constructor(private http: HttpClient) {}

    getAll(): Observable<DrawingToDatabase[]> {
        return this.http.get<DrawingToDatabase[]>(BASE_URL).pipe(catchError(this.handleError<DrawingToDatabase[]>('getAll')));
    }

    getById(id: string): Observable<DrawingToDatabase> {
        return this.http.get<DrawingToDatabase>(BASE_URL + id).pipe(catchError(this.handleError<DrawingToDatabase>('getByID')));
    }

    getByName(name: string): Observable<DrawingToDatabase[]> {
        return this.http.get<DrawingToDatabase[]>(BASE_URL + name).pipe(catchError(this.handleError<DrawingToDatabase[]>('getByName')));
    }

    getByTag(tag: string): Observable<DrawingToDatabase[]> {
        return this.http.get<DrawingToDatabase[]>(BASE_URL + 'tag/' + tag).pipe(catchError(this.handleError<DrawingToDatabase[]>('getByTag')));
    }

    save(drawingtodatabase: DrawingToDatabase): Observable<void> {
        return this.http.post<void>(BASE_URL, drawingtodatabase).pipe(catchError(this.handleError<void>('save')));
    }

    update(id: string, drawingtodatabase: DrawingToDatabase): Observable<DrawingToDatabase> {
        return this.http.patch<DrawingToDatabase>(BASE_URL + id, drawingtodatabase).pipe(catchError(this.handleError<DrawingToDatabase>('update')));
    }

    delete(id: string): Observable<string> {
        return this.http.delete<string>(BASE_URL + id).pipe(catchError(this.handleError<string>('delete')));
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return (error: Error): Observable<T> => {
            alert(error);
            return of(result as T);
        };
    }
}

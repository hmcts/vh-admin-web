import { ScrollableSuitabilityAnswersService, SuitabilityAnswersPage } from './scrollable-suitability-answers.service';

export class ApiStub implements ScrollableSuitabilityAnswersService {
    private readonly results = new Map<String, SuitabilityAnswersPage>();
    private firstCall: SuitabilityAnswersPage;

    getSuitabilityAnswers(cursor?: string, limit?: number): Promise<SuitabilityAnswersPage> {
        if (cursor === null) {
            return Promise.resolve(this.firstCall);
        }
        if (!this.results.has(cursor)) {
            return Promise.reject(`Cursor '${cursor}' not !`);
        }
        return Promise.resolve(this.results.get(cursor));
    }

    forFirstCall(): PageResponseBuilder {
        return new PageResponseBuilder(results => this.firstCall = results);
    }

    forCursor(cursor: string): PageResponseBuilder {
        return new PageResponseBuilder(results => this.results.set(cursor, results));
    }
}

class PageResponseBuilder {
    constructor(private applyMethod: (response: SuitabilityAnswersPage) => void) {}

    returnsWithResponse(responose: SuitabilityAnswersPage) {
        this.applyMethod(responose);
    }
}

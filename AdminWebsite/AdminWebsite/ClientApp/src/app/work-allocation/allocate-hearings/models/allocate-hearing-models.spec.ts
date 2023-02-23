import { newGuid } from '@microsoft/applicationinsights-core-js';
import { AllocationHearingsResponse } from 'src/app/services/clients/api-client';
import { AllocateHearingItemModel, AllocateHearingModel } from './allocate-hearing.model';

describe('AllocateHearingItemModel', () => {
    let testData: AllocationHearingsResponse;

    beforeEach(() => {
        testData = new AllocationHearingsResponse({
            hearing_id: '1',
            allocated_cso: null,
            scheduled_date_time: new Date(),
            case_number: 'case1',
            case_type: 'generic',
            duration: 30
        });
    });

    it('should default to unchecked', () => {
        const model = new AllocateHearingItemModel(
            testData.hearing_id,
            testData.scheduled_date_time,
            testData.duration,
            testData.case_number,
            testData.case_type,
            testData.allocated_cso
        );

        expect(model.checked).toBeFalsy();
        expect(model.allocatedOfficerUsername).toBe(testData.allocated_cso);
        expect(model.allocatedOfficerId).toBeUndefined();
    });

    it('should update checked value', () => {
        const model = new AllocateHearingItemModel(
            testData.hearing_id,
            testData.scheduled_date_time,
            testData.duration,
            testData.case_number,
            testData.case_type,
            testData.allocated_cso
        );

        model.setChecked(true);
        expect(model.checked).toBeTruthy();

        model.setChecked(false);
        expect(model.checked).toBeFalsy();
    });

    it('should update assigned cso', () => {
        const username = 'newcso@test.com';
        const id = newGuid();
        const model = new AllocateHearingItemModel(
            testData.hearing_id,
            testData.scheduled_date_time,
            testData.duration,
            testData.case_number,
            testData.case_type,
            testData.allocated_cso,
            true
        );

        model.updateAssignedCso(username, id);

        expect(model.allocatedOfficerUsername).toBe(username);
        expect(model.allocatedOfficerId).toBe(id);
        expect(model.hasChanged).toBeTruthy();
        expect(model.hasWorkHoursClash).toBeFalsy();
    });
});

describe('AllocateHearingModel', () => {
    let testData: AllocationHearingsResponse[];
    let testDataOverlapping: AllocationHearingsResponse[];

    beforeEach(() => {
        testData = [
            new AllocationHearingsResponse({
                hearing_id: '1',
                allocated_cso: null,
                scheduled_date_time: new Date()
            }),
            new AllocationHearingsResponse({
                hearing_id: '2',
                allocated_cso: 'john@cso.com',
                scheduled_date_time: new Date()
            }),
            new AllocationHearingsResponse({
                hearing_id: '3',
                allocated_cso: 'john@cso.com',
                scheduled_date_time: new Date()
            }),
            new AllocationHearingsResponse({
                hearing_id: '4',
                allocated_cso: 'tl@cso.com',
                scheduled_date_time: new Date()
            })
        ];

        testDataOverlapping = [
            new AllocationHearingsResponse({
                hearing_id: '1',
                allocated_cso: null,
                scheduled_date_time: new Date('2022-01-01 00:00:00'),
                duration: 100
            }),
            new AllocationHearingsResponse({
                hearing_id: '2',
                allocated_cso: 'john@cso.com',
                scheduled_date_time: new Date('2022-01-01 00:00:00'),
                duration: 100
            }),
            new AllocationHearingsResponse({
                hearing_id: '3',
                allocated_cso: 'john@cso.com',
                scheduled_date_time: new Date('2022-01-01 00:00:00'),
                duration: 100
            }),
            new AllocationHearingsResponse({
                hearing_id: '4',
                allocated_cso: 'tl@cso.com',
                scheduled_date_time: new Date('2022-01-01 00:00:00'),
                duration: 100
            })
        ];
    });

    it('should default to no selected hearings', () => {
        const model = new AllocateHearingModel(testData);

        expect(model.areAllChecked).toBeFalsy();
        expect(model.hasSelectedHearings).toBeFalsy();
        expect(model.selectedHearingIds.length).toBe(0);
    });

    it('should return hasSelectedHearings true when at least one hearing is checked', () => {
        const model = new AllocateHearingModel(testData);
        const hearing = testData[0];
        model.checkHearing(hearing.hearing_id);

        expect(model.hasSelectedHearings).toBeTruthy();
        expect(model.selectedHearingIds).toContain(hearing.hearing_id);
    });

    it('should safely exit when non-existent hearing id is checked', () => {
        const model = new AllocateHearingModel(testData);

        model.checkHearing('1000');

        expect(model.checkHearing('111111'));
        expect(model).toBeTruthy();
    });

    it('should check all hearings', () => {
        const model = new AllocateHearingModel(testData);

        model.checkAllHearings();

        expect(model.areAllChecked).toBeTruthy();
    });

    it('should update selected hearings to new cso and set concurrency count to 4', () => {
        const model = new AllocateHearingModel(testDataOverlapping);

        const newUserName = 'new@test.com';
        const newId = newGuid();
        model.checkAllHearings();

        model.assignCsoToSelectedHearings(newUserName, newId);

        expect(model.areAllChecked).toBeTruthy();
        expect(model.hearings.every(h => h.allocatedOfficerId === newId && h.allocatedOfficerUsername === newUserName)).toBeTruthy();
        expect(model.hearings.every(h => h.concurrentHearingsCount === 4 && h.allocatedOfficerUsername === newUserName)).toBeTruthy();
    });

    it('should update selected hearings to new cso', () => {
        const model = new AllocateHearingModel(testData);

        const newUserName = 'new@test.com';
        const newId = newGuid();
        model.checkAllHearings();

        model.assignCsoToSelectedHearings(newUserName, newId);

        expect(model.areAllChecked).toBeTruthy();
        expect(model.hearings.every(h => h.allocatedOfficerId === newId && h.allocatedOfficerUsername === newUserName)).toBeTruthy();
    });

    it('should revert hearings to original state when unchecked', () => {
        const model = new AllocateHearingModel(testData);
        const hearing = testData[0];
        const newUserName = 'new@test.com';
        const newId = newGuid();

        // first simulate the checking and assigning of a hearing
        model.checkHearing(hearing.hearing_id);
        model.assignCsoToSelectedHearings(newUserName, newId);

        expect(model.selectedHearingIds.length).toBe(1);
        expect(model.selectedHearingIds).toContain(hearing.hearing_id);
        const postAssignmentHearing = model.hearings.find(h => h.hearingId === hearing.hearing_id);
        expect(postAssignmentHearing.allocatedOfficerId).toBe(newId);
        expect(postAssignmentHearing.allocatedOfficerUsername).toBe(newUserName);
        expect(postAssignmentHearing.checked).toBeTruthy();

        // then revert and confirm hearing details are as before
        model.uncheckAllHearingsAndRevert();
        expect(model.selectedHearingIds.length).toBe(0);
        expect(model.selectedHearingIds).not.toContain(hearing.hearing_id);

        const postRevertHearing = model.hearings.find(h => h.hearingId === hearing.hearing_id);
        expect(postRevertHearing.allocatedOfficerUsername).toEqual(hearing.allocated_cso);
        expect(postRevertHearing.allocatedOfficerUsername).toBeNull();
        expect(postRevertHearing.checked).toBeFalsy();
    });

    it('should update original state when allocation has been confirmed', () => {
        const model = new AllocateHearingModel(testData);

        const updatedAllocatedHearings = [
            new AllocationHearingsResponse({
                hearing_id: '1',
                allocated_cso: 'john@cso.com',
                scheduled_date_time: new Date()
            }),
            new AllocationHearingsResponse({
                hearing_id: '2',
                allocated_cso: 'john@cso.com',
                scheduled_date_time: new Date()
            }),
            new AllocationHearingsResponse({
                hearing_id: '3',
                allocated_cso: 'john@cso.com',
                scheduled_date_time: new Date()
            })
        ];

        model.updateHearings(updatedAllocatedHearings);

        expect(model.originalState.filter(x => x.allocated_cso === 'john@cso.com').length).toBe(3);
        expect(model.hearings.filter(x => x.allocatedOfficerUsername === 'john@cso.com').length).toBe(3);
    });
});

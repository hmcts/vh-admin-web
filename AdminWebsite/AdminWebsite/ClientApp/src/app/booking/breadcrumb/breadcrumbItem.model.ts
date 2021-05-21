export class BreadcrumbItemModel {
    constructor(id: number, value: boolean, name: string, url: string, active: boolean, lastMinuteAmendable: boolean) {
        this.Id = id;
        this.Value = value;
        this.Name = name;
        this.Url = url;
        this.Active = active;
        this.LastMinuteAmendable = lastMinuteAmendable;
    }
    Id: number;
    Value: boolean;
    Name: string;
    Url: string;
    Active: boolean;
    LastMinuteAmendable: boolean;
}

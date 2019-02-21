export class BreadcrumbItemModel {
    constructor(id: number, value: boolean, name: string, url: string, active: boolean) {
        this.Id = id;
        this.Value = value;
        this.Name = name;
        this.Url = url;
        this.Active = active;
    }
    Id: number;
    Value: boolean;
    Name: string;
    Url: string;
    Active: boolean;
}

export interface VideoAccessPointDto {
    id?: string;
    displayName: string;
    defenceAdvocate?: EndpointLink;
}

export interface EndpointLink {
    email: string;
    displayName: string;
}

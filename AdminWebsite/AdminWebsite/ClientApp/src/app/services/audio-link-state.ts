export enum AudioLinkState {
    initial, // no get link has been requested
    loading, // getting link from server
    ready, // link has been retrieved
    finished, // have the link in a local variable
    error // we are in an error state
}

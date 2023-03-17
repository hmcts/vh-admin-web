# Generating the clients

If the interface for either the MVC or the Bookings API is updated these can be rebuilt using the following commands:

In the `AdmniWebsite/ClientApp` folder:

``` shell
npx nswag run --/runtime:Net60 api-ts.nswag
```

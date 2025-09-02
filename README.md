# Submission For Conduit

This is a simple nest JS application with two controllers, and two serviecs.

## TransactionsService

- All logic relating to transactions for the controller to consume.
  TransactionsController
- All endpoint for transactions like create.

## AccountsService

- All logic relating to transactions for the controller to consume.
  AccountsController
- All endpoint for transactions like create.

## Commands

Each is set up relatively the same. You should be able to run the program by

`npm install && npm run start:dev`

to run unit tests

`npm run test`

if you would like to see the swagger docs just hit the endpoint.

`http://localhost:3000/api`

## Notes

But the more importantly we have the requiredendpoints.

**POST /accounts**

**GET /accounts/:id**

**POST /transactions**

I added a few more endpoints for each this was mostly to check as I went along. There are

`GET /accounts`
`GET /accounts/:id`
`GET /transactions`
`GET /transactions/:id`

As well as a few others for helping me dev hopefully not to distracting from the main objective.

Please reach out if you have any trouble running the application.

Thanks
Ryan Johnson (RJ)

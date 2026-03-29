import { Controller, Get, Route, Tags } from "tsoa";

@Route("users")
@Tags("User")
export class UsersController extends Controller {
  @Get("/")
  public async getUsers(): Promise<string> {
    const message = "Hello Tsoa!";
    return message;
  }
}

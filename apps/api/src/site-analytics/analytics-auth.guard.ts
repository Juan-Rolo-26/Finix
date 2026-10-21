import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AnalyticsAuthGuard extends AuthGuard('jwt') {
  handleRequest(error:any,user:any,_info:any,context:ExecutionContext) {
    if(context.switchToHttp().getRequest().headers.authorization && (!user||error))throw new UnauthorizedException('La sesión debe actualizarse antes de registrar la visita');
    return user||null;
  }
}

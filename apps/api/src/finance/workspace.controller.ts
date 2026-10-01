import {Body,Controller,Delete,Get,Header,Param,Patch,Post,Query,Request,UseGuards,UseFilters} from '@nestjs/common';
import {FinanceErrorFilter} from './finance-error.filter';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {FinanceService} from './workspace.service';
@Controller('personal-finance')
@UseGuards(JwtAuthGuard)
@UseFilters(FinanceErrorFilter)
export class FinanceController {
    constructor(private readonly finance:FinanceService) {}
    @Get('snapshot') @Header('Cache-Control','no-store')
    snapshot(@Request() r:any,@Query('currency') c?:string,@Query('month') m?:string) {return this.finance.getSnapshot(r.user.id,c,m);}
    @Post('preferences') preferences(@Request() r:any,@Body() b:any) {return this.finance.savePreferences(r.user.id,b);}
    @Post('import/preview') preview(@Request() r:any,@Body() b:any) {return this.finance.previewImport(r.user.id,b);}
    @Post('import/confirm') import(@Request() r:any,@Body() b:any) {return this.finance.importCsv(r.user.id,b);}
    @Get('export') @Header('Cache-Control','no-store')
    export(@Request() r:any) {return this.finance.exportData(r.user.id);}
    @Post('erase') erase(@Request() r:any,@Body() b:any) {return this.finance.erase(r.user.id,b.confirmation);}
    @Post('goals/:id/contributions') contribute(@Request() r:any,@Param('id') id:string,@Body() b:any) {return this.finance.contribute(r.user.id,id,b.amount);}
    @Get(':resource') @Header('Cache-Control','no-store')
    list(@Request() r:any,@Param('resource') s:any) {return this.finance.list(r.user.id,s);}
    @Post(':resource') create(@Request() r:any,@Param('resource') s:any,@Body() b:any) {return this.finance.save(r.user.id,s,b);}
    @Patch(':resource/:id') update(@Request() r:any,@Param('resource') s:any,@Param('id') id:string,@Body() b:any) {return this.finance.save(r.user.id,s,b,id);}
    @Delete(':resource/:id') remove(@Request() r:any,@Param('resource') s:any,@Param('id') id:string) {return this.finance.remove(r.user.id,s,id);}
}

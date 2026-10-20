import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { z } from 'zod';

const requestInput = z.object({ query:z.string().trim().min(2).max(80).regex(/^[\p{L}\p{N} .,&'():/$-]+$/u), intent:z.enum(['SEARCH','REQUEST']).default('REQUEST') });
export const normalizeAnalysisQuery = (query:string) => query.normalize('NFKC').replace(/^\$/, '').trim().replace(/\s+/g,' ').toUpperCase();

@Injectable()
export class AnalysisRequestsService {
    constructor(private readonly prisma:PrismaService) {}
    async record(userId:string, raw:unknown) {
        const parsed = requestInput.safeParse(raw);
        if (!parsed.success) throw new BadRequestException('Escribí un nombre de empresa o ticker de 2 a 80 caracteres.');
        const query = parsed.data.query, normalizedQuery = normalizeAnalysisQuery(query), intent = parsed.data.intent;
        const available = await this.prisma.assetAnalysis.findFirst({ where:{ status:'PUBLISHED',isActive:true,OR:[{ ticker:{equals:normalizedQuery,mode:'insensitive'} },{ symbol:{equals:normalizedQuery,mode:'insensitive'} },{ companyName:{contains:query,mode:'insensitive'} }] },select:{slug:true,ticker:true} });
        if (available) return { available:true,slug:available.slug || available.ticker?.toLowerCase(),message:'Esta empresa ya tiene un análisis disponible.' };
        const where = { userId_normalizedQuery:{userId,normalizedQuery} };
        const previous = await this.prisma.analysisRequest.findUnique({where});
        if (previous && ((intent==='REQUEST' && previous.requestCount>0) || (intent==='SEARCH' && Date.now()-previous.updatedAt.getTime()<60000))) {
            return { id:previous.id,status:previous.status,alreadyRequested:previous.requestCount>0,message:previous.requestCount>0?'Tu solicitud ya está registrada.':'Búsqueda registrada.' };
        }
        const request = await this.prisma.analysisRequest.upsert({where,create:{ userId,query,normalizedQuery,searchCount:intent==='SEARCH'?1:0,requestCount:intent==='REQUEST'?1:0,status:'PENDING' },update:{query,...(intent==='SEARCH'?{searchCount:{increment:1}}:{requestCount:{increment:1}}),status:'PENDING'}});
        return { id:request.id,status:request.status,message:intent==='REQUEST'?'Solicitud enviada al equipo de Finix.':'Búsqueda registrada.' };
    }
    async list() {
        const [items,pending] = await Promise.all([
            this.prisma.analysisRequest.findMany({ take:200,orderBy:[{updatedAt:'desc'}],include:{user:{select:{username:true}}} }),
            this.prisma.analysisRequest.count({where:{status:{in:['PENDING','IN_REVIEW']}}}),
        ]);
        return {items,pending};
    }
    async update(id:string,raw:any) {
        const status = z.enum(['PENDING','IN_REVIEW','PUBLISHED','DISMISSED']).safeParse(raw?.status);
        if (!status.success) throw new BadRequestException('Estado de solicitud inválido.');
        const exists = await this.prisma.analysisRequest.findUnique({where:{id},select:{id:true}});
        if (!exists) throw new NotFoundException('Solicitud no encontrada.');
        return this.prisma.analysisRequest.update({where:{id},data:{status:status.data}});
    }
}

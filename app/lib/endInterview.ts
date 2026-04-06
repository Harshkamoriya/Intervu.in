import prisma from "./db";
export async function endInterview(
    sessionId : string,
    transcript :any[],
    scores:any[],
    finalReport? :any
){
    return prisma.interviewSession.update({
        where:{id:sessionId},
        data:{
            transcript ,
            scores ,
            status :"ENDED",
            endedAt:new Date(),
            finalReport:finalReport ? finalReport :undefined ,
        }
    })
}
import { sql} from '@/lib/postgres-client';

export async function addErrorLogs(userId:string, errorType: string, errorMsg: string) {
	try{
		const { rowCount } = await sql`INSERT INTO qa_error_logs 
        (user_id, error_type, error_msg) 
        VALUES (
			${userId},
            ${errorType},
            ${errorMsg}
        )`;
	}catch(e){
		console.log("add error logs error:", e);
		return 0;
	}
	
}
const buckets=new Map<string,{start:number;count:number}>();
export function hit(key:string,limit:number,windowMs:number){const now=Date.now();const old=buckets.get(key);if(!old||now-old.start>windowMs){buckets.set(key,{start:now,count:1});return true}if(old.count>=limit)return false;old.count++;return true}

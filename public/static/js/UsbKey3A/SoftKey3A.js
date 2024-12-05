
var  GETVERSION = 0x01;
var  GETID = 0x02;
var  GETVEREX = 0x05;
var  CAL_TEA = 0x08;
var  SET_TEAKEY = 0x09;
var  READBYTE = 0x10;
var  WRITEBYTE = 0x11;
var  YTREADBUF = 0x12;
var  YTWRITEBUF = 0x13;
var  MYRESET = 0x20;
var  YTREBOOT = 0x24;
var  SET_ECC_PARA = 0x30;
var  GET_ECC_PARA = 0x31;
var  SET_ECC_KEY = 0x32;
var  GET_ECC_KEY = 0x33;
var  MYENC = 0x34;
var  MYDEC = 0X35;
var  SET_PIN = 0X36;
var  GEN_KEYPAIR = 0x37;
var  YTVERIFY = 0x52;
var  GET_CHIPID = 0x53;

//errcode 
var FAILEDGENKEYPAIR = -21;
var FAILENC = -22;
var FAILDEC = -23;
var FAILPINPWD = -24;
var USBStatusFail = -50;  
var ERR_SET_REPORT=-94;
var ERR_GET_REPORT=-93;
var ERR_OVER_SEC_MAX_LEN = -81;
var MAX_LEN = 496;

var SM2_ADDBYTE = 97;//
var MAX_ENCLEN = 128; //
var MAX_DECLEN = (MAX_ENCLEN + SM2_ADDBYTE); //
var SM2_USENAME_LEN = 80;// 

var ECC_MAXLEN = 32;
var PIN_LEN = 16;

var MAX_TRANSE_LEN=255;
var MAX_LEN_OLD=21
var ID_LEN=16;


class SoftKey3A
{
    encoding="utf-8"//这里可以改编码：例如："gbk"
    decoder = new TextDecoder(this.encoding)
    encoder=new TextEncoder(this.encoding);
    gEncOutData=0
    SoftKey3A() {

    }

    GetLastError()
    {
        return this.lasterror;
    }

    SetEncode(inCode)
    {
        this.encoding=inCode
    }

    DecodeStringEx(InBuf)
    {
        var OutString= this.decoder.decode(InBuf)
        var pos = OutString.indexOf("\0");
        if(pos<0)return OutString;
        return OutString.slice(0,pos)
    }
    MacthUKeyID(mDevices)
    {
        if ((mDevices.vendorId == SoftKey3A.VID && mDevices.productId == SoftKey3A.PID) ||
        (mDevices.vendorId == SoftKey3A.VID_NEW && mDevices.productId == SoftKey3A.PID_NEW) ||
        (mDevices.vendorId == SoftKey3A.VID_NEW_2 && mDevices.productId == SoftKey3A.PID_NEW_2))
        {
            return true;
        }
        return false
    }

    concatenate(resultConstructor, ...arrays) {
        let totalLength = 0;
        for (const arr of arrays) {
            totalLength += arr.length;
        }
        const result = new resultConstructor(totalLength);
        let offset = 0;
        for (const arr of arrays) {
            result.set(arr, offset);
            offset += arr.length;
        }
        return result;
    }

    AddZero( InKey)
    {
        var nlen;
        var n;
        nlen =InKey.length;
        for(n=nlen;n<=7;n++)
        {
            InKey = "0" + InKey;
        }
        return  InKey;
    }

    myconvert( HKey,  LKey)
    {
        HKey = this.AddZero(HKey);
        LKey = this.AddZero(LKey);
        var out_data=new Uint8Array(8)
        var n;
        for(n=0;n<=3;n++)
        {
            out_data[n] = this.HexToInt(HKey.substring(  n * 2, n * 2+2));
        }
        for(n=0;n<=3;n++)
        {
            out_data[n + 4] = this.HexToInt(LKey.substring( n * 2, n * 2+2));
        }
        return out_data;
    }   

////bin2hex  & hex2bin     
    ByteArrayToHexString(Inb,len)
    {
            var outstring= "";
            for (var n = 0 ;n<= len - 1;n++)
            {
                outstring= outstring+this.myhex(Inb[n]) ;
            }
            return outstring.toUpperCase();
    }
        
    HexStringToByteArray(InString)
        {
            var nlen;
            var retutn_len;
            var n,i;
            var b;
            var temp;
            nlen = InString.length;
            if (nlen < 16) retutn_len = 16;
            retutn_len = nlen / 2;
            b = new Uint8Array(retutn_len);
            i = 0;
            for(n=0;n<nlen;n=n+2)
            {
                temp = InString.substring( n, n+2);
                b[i] = this.HexToInt(temp);
                i = i + 1;
            }
            return b;
    }
 ////////    

//decimal to hex && hex2dec	
   myhex(value) {
    if (value < 16)
      return '0' + value.toString(16);
    return value.toString(16);
    };

    HexToInt( s)
    {
        var hexch ="0123456789ABCDEF";
        var i, j;
        var r, n, k;
        var ch;
        s=s.toUpperCase();

        k = 1; r = 0;
        for (i = s.length; i > 0; i--)
        {
            ch = s.substring(i - 1,  i-1+1);
            n = 0;
            for (j = 0; j < 16; j++)
            {
                if (ch == hexch.substring(j, j+1) )
                {
                    n = j;
                }
            }
            r += (n * k);
            k *= 16;
        }
        return r;
    };
////////////////

 /////////////// send cmd only ,no carry data  
    async SendNoWithData(CmdFlag) {
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ; 
        await this.SendWithData( CmdFlag,array_in);
        return this.lasterror;
    };
    ///////////send cmd and data
    async SendWithDataNoErr(CmdFlag,array_in,connection) {
        
        var array_out
        this.lasterror=0;
        var featureReport = new Uint8Array(MAX_TRANSE_LEN+1)

        featureReport[0] = CmdFlag;
    
        for (var i = 1; i < array_in.length; i++) {
            featureReport[i] =array_in[i];
        }
        if(!connection)
        {
            this.lasterror= -92;
            return array_out;
        }
        if (!connection.opened) {
            await connection.open();
        }
        try {
            await connection.sendFeatureReport(2, featureReport);
        } catch (error) {
            var featureReport_old = new Uint8Array(MAX_LEN_OLD)
            for (var i = 0; i < MAX_LEN_OLD; i++) {
                featureReport_old[i] =featureReport[i];
            }
            try {
                await connection.sendFeatureReport(2, featureReport_old);
            } catch (error) {
                 connection.close();this.lasterror= ERR_SET_REPORT;return array_out;
            }
        }
        try {
            array_out= await connection.receiveFeatureReport(1,MAX_TRANSE_LEN-1) ;
        }catch (error) {
            connection.close();this.lasterror= ERR_GET_REPORT;return array_out;
        }
        connection.close();
        var OutBuf = new Uint8Array(MAX_TRANSE_LEN)
        for(var n=0;n<array_out.byteLength;n++)
        {
            OutBuf[n]=array_out.getInt8(n);
        }
        return OutBuf;
    }

    async SendWithData(CmdFlag,array_in,KeyPath) {
        
        var array_out=await this.SendWithDataNoErr(CmdFlag,array_in,KeyPath);

        if( array_out[0] != 0)
        {
            this.lasterror= array_out[0] - 256;
        }
        else
        {
            this.lasterror=0;
        }

        return array_out;

    }
    ///////////////
    async GetOneByteDataFromUsbKey(cmd,KeyPath)
    {
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        var array_out;
        array_out=await  this.SendWithDataNoErr( cmd,array_in,KeyPath);
        if(this.lasterror)return undefined;
        return array_out[0];
    }
////////
    async FindPort(start) {
        this.lasterror=0;
        var count=0;
        let devices = await navigator.hid.getDevices();
        if(devices.length<1)
        {
            //启动权限，注意，这个是一定需要的，因为要先启动权限才可以访问USBKey
            try {
                devices = await navigator.hid.requestDevice({
                filters: [
                    {
                    vendorId: 0x3689,
                    productId: 0x8762,
                    },
                    {
                    vendorId: 0x3689,
                    productId: 0x2020,
                    },
                    {
                    vendorId: 0x2020,
                    productId: 0x2020,
                    }
                ],
                });
            } catch (error) {
                window.alert("there is a error when choose usebkey!")
            }
        }
        devices = await navigator.hid.getDevices();
        for(var i in devices )
       {  
            if (this.MacthUKeyID(devices[i]))
            {
                if(count==start)
                {
                    this.lasterror=0;
                    return devices[i];
                }
                count++;
            }
        };

        this.lasterror=-92;
        return null;
    }
////////////////////////////////////////////////////////////////////////////////////
    async FindPort_2( start,in_data,  verf_data )
    {
        var n;
        var count=0;
        var out_data=0;
        for(n=0;n<256;n++)
        {
            var KeyPath=await this.FindPort(n);
            if (this.lasterror != 0 ) return null;
            out_data =await this.sWriteEx(in_data,KeyPath);
            if (this.lasterror != 0 ) return null;
            if (out_data == verf_data ){ 
                if(start==count)return KeyPath;
                count++;
            }
        }
        return null;
    };

    async GetVersionEx(KeyPath)
    {
        return await this.GetOneByteDataFromUsbKey(5,KeyPath);
    };

    async GetVersion(KeyPath)
    {
        return await this.GetOneByteDataFromUsbKey(1,KeyPath);  
    };
    /////
    async subGetID(KeyPath)
    {
      
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        var array_out;
        var t1=new Uint8Array(4);
        var t2=new Uint8Array(4);
        array_out=await  this.SendWithDataNoErr( 2,array_in,KeyPath);
        return array_out;
    }
 	
    async GetID(KeyPath)
    {
        var IDInfo
        var array_out= await this.subGetID( KeyPath);
        if(this.lasterror!=0){return ""}
        IDInfo=this.ByteArrayToHexString(array_out,8);
        return IDInfo;
    }

    async GetID_1(KeyPath)
    {
       
        var array_out= await this.subGetID( KeyPath);
        if(this.lasterror!=0){return 0}
        return array_out[3]|(array_out[2]<<8)|(array_out[1]<<16)|(array_out[0]<<24);
    }

    async GetID_2(KeyPath)
    {
       
        var array_out= await this.subGetID( KeyPath);
        if(this.lasterror!=0){return 0}
        return array_out[7]|(array_out[6]<<8)|(array_out[5]<<16)|(array_out[4]<<24);
    }
 	
    async GetChipID(KeyPath)
    {
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        var array_out;

        var OutChipID = "";var outb=new Uint8Array(ID_LEN) ;

        array_out=await this.SendWithDataNoErr( GET_CHIPID,array_in,KeyPath);
        if(this.lasterror!=0){return ""}
        if (array_out[0] != 0x20) 
        {
            this.lasterror= USBStatusFail;
            return OutChipID;
        }
    
        outb = array_out.slice(1,ID_LEN+1);
    

        OutChipID = this.ByteArrayToHexString(outb, 16);
        return OutChipID;
        
    };

    async SetWritePassword( W_HKey,  W_LKey,  new_HKey,  new_LKey,KeyPath)
    {
        var address;
        var ary1=this.myconvert(W_HKey, W_LKey);
        var ary2=this.myconvert(new_HKey, new_LKey);
        address = 504;

        this.lasterror =await  this.Sub_WriteByte(ary2, address, 8, ary1,0,KeyPath);

        return this.lasterror;
    }

    async SetReadPassword( W_HKey,  W_LKey,  new_HKey,  new_LKey,KeyPath)
    {
        var address;
        var ary1=this.myconvert(W_HKey, W_LKey);
        var ary2=this.myconvert(new_HKey, new_LKey);
        address = 496;

        this.lasterror =await  this.Sub_WriteByte(ary2, address, 8, ary1,0,KeyPath);

        return this.lasterror;
    }

    async NT_SetCal(cmd, indata,  IsHi,  pos,KeyPath )
    {
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        var n;
        array_in[1] = IsHi;
        for(n=0;n <8;n++)
        {
            array_in[2 + n] = indata[n + pos];
        }
        
        var array_out=await this.SendWithData( cmd,array_in,KeyPath);
        if(this.lasterror!=0)return this.lasterror;
        if (array_out[0] != 0)
        {
            this.lasterror= -82;
        }
        return this.lasterror;
    }

    async Sub_SetCal( cmd,Key,KeyPath)
    {
        var KeyBuf=this.HexStringToByteArray(Key);
        this.lasterror =await this.NT_SetCal(cmd,KeyBuf, 0, 8,KeyPath);
        if ( this.lasterror != 0) return  this.lasterror;
        return this.NT_SetCal(cmd,KeyBuf, 1, 0,KeyPath);

    }

    async SetCal_2( Key,KeyPath)
    {
        return await this.Sub_SetCal(SET_TEAKEY,Key,KeyPath);
    }

    async SetCal_New(Key,KeyPath)
    {
        return await this.Sub_SetCal(13,Key,KeyPath);
    }

    async Sub_EncString(cmd, InString,  KeyPath)
    {
            var n;var m;
            var nlen;

            var b=this.encoder.encode(InString);
            var zero_buf = new Uint8Array(1);
            b = this.concatenate(Uint8Array,b,zero_buf);
            nlen=b.length;
            if( b.length < 8)
            {
                nlen = 8;
            }

            var outb=new Uint8Array(nlen);
            var inb=new Uint8Array(nlen);
            for(n=0;n<b.length;n++)
            {
            	 outb[n]=b[n];
            	 inb[n]=b[n];
            }

            for(n=0;n<=(nlen-8);n=n+8)
            {
                var tmpoutb =await  this.NT_Cal(cmd,inb, n,KeyPath);
                for(m=0;m<8;m++)
                {
                    outb[m+n]=tmpoutb[m];
                }
                if (this.lasterror != 0) '';
            }
            
            return this.ByteArrayToHexString(outb,outb.length);
    }

    async EncString( InString,KeyPath)
    {
        return await this.Sub_EncString(8,InString,KeyPath)
    }

    async EncString_New( InString,KeyPath)
    {
        return await this.Sub_EncString(12,InString,KeyPath)
    }

    async NT_Cal(cmd, InBuf ,  pos,KeyPath)
    {
        var n;
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        var outbuf= new Uint8Array(8);
        for(n=1;n<=8;n++)
        {
            array_in[n] = InBuf[n - 1+ pos];
        }
        var array_out=await this.SendWithDataNoErr(cmd, array_in,KeyPath);
        if(this.lasterror!=0)return undefined;
        for(n=0;n <8;n++)
        {
            outbuf[n] = array_out[n];
        }
        if( array_out[8] != 0x55)
        {
            this.lasterror= -20;
        }
        return outbuf;
    }

    async Cal(Inbuf,KeyPath)
    {
        return await this.NT_Cal(8,Inbuf,0,KeyPath);
    }

    async Cal_New(Inbuf,KeyPath)
    {
        return await this.NT_Cal(12,Inbuf,0,KeyPath);
    }

    async SimpleCalData(cmd,in_data,KeyPath)
    {   
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        array_in[1]=(in_data & 255);
        array_in[2]=((in_data >> 8) & 255);
        array_in[3] = ((in_data >> 16) & 255);
        array_in[4] = ((in_data >> 24) & 255);
        
        var array_out;
        array_out= await this.SendWithDataNoErr( cmd,array_in,KeyPath);
        if(this.lasterror!=0){return 0}

        return array_out[0] | (array_out[1] << 8) | (array_out[2] << 16) | (array_out[3] << 24);
    }

    async sWriteEx( in_data ,KeyPath)
    {
        return await this.SimpleCalData(0x03,in_data,KeyPath);
    }

    async sWrite_2Ex( in_data ,KeyPath)
    {
        return await this.SimpleCalData(0x04,in_data,KeyPath);
    }

    async sWriteEx_New( in_data ,KeyPath)
    {
        return await this.SimpleCalData(0x0a,in_data,KeyPath);
    }

    async sWrite_2Ex_New( in_data ,KeyPath)
    {
        return await this.SimpleCalData(0x0b,in_data,KeyPath);
    }

    async sWrite( in_data ,KeyPath)
    {
        this.gEncOutData= await this.SimpleCalData(0x03,in_data,KeyPath);
        return this.lasterror
    }

    async sWrite_2( in_data ,KeyPath)
    {
        this.gEncOutData= await this.SimpleCalData(0x04,in_data,KeyPath);
        return this.lasterror
    }

    async sRead(KeyPath)
    {
        return this.gEncOutData
    }
 /////////////////////
    async Sub_WriteByte( indata,address,nlen,password,pos,KeyPath)
    {  
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        var addr_l;
        var addr_h;
        var n;
        if ((address + nlen - 1) > (MAX_LEN + 17) || (address < 0)) return -81;
        addr_h = (address >> 8) * 2;
        addr_l = address & 255;
    
        array_in[1] = addr_h;
        array_in[2] = addr_l;
        array_in[3] = nlen;
    
        for (n = 0; n <= 7; n++)
        {
            array_in[4 + n] = password[n];
        }
        for (n = 0; n < nlen; n++)
        {
            array_in[12 + n] = indata[n + pos];
        }
        
        var array_out=await this.SendWithDataNoErr(0x13, array_in,KeyPath);
        if(this.lasterror!=0)return this.lasterror;
        if (array_out[0] != 0)
        {
            this.lasterror= -82;
        }
        return this.lasterror;
    }
   
    async Sub_ReadByte(address,  nlen, password,KeyPath)
    {
        var outData = new Uint8Array(nlen );
        var array_out;
        var ret;
        if( nlen > MAX_TRANSE_LEN )
        {
            this.lasterror=ERR_OVER_SEC_MAX_LEN;
            return outData;
            }
        if( (address + nlen > MAX_LEN) )
        {
            this.lasterror==ERR_OVER_SEC_MAX_LEN;
            return outData;
            }

        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        var  addr_l;
        var  addr_h;
        var n;

        addr_h = (address >> 8) * 2;
        addr_l = address & 255;

        array_in[1] = addr_h;
        array_in[2] = addr_l;
        array_in[3] = nlen;
        
        
        for( n = 0 ;n<= 7;n++)
        {
            array_in[4 + n] = password[n];
        }

        array_out=await this.SendWithDataNoErr(0x12, array_in,KeyPath);
        if(this.lasterror!=0)return undefined;
        if (array_out[0] != 0)
        {
            this.lasterror= -82;return outData;
        }
        for( n = 0 ;n<(nlen);n++)
        {
            outData[n] = array_out[n + 1];
        }
        return outData;
    }

/////////////////////////////
    async YWriteEx( indata,   address,  nlen,  HKey,  LKey,KeyPath )
    {
        var ret = 0;
        var n, trashLen = 16;
    
        if ((address + nlen - 1 > MAX_LEN) || (address < 0)) return -81;

        trashLen = trashLen - 8;
        
        var password=this.myconvert(HKey, LKey);
        var tmplen;
        var pos=0;
        while(nlen>0)
        {
            if(nlen>trashLen)
                tmplen=trashLen;
            else
            tmplen=nlen;
            this.lasterror = await this.Sub_WriteByte(indata, address + pos, tmplen, password,  pos,KeyPath);
            if (this.lasterror != 0) {  return this.lasterror; }
            nlen=nlen-trashLen;
            pos=pos+trashLen;
        }
    
        return this.lasterror;
    }

    async YWriteString(InString,Address , HKey,  LKey,KeyPath)
    {
        var Buf=this.encoder.encode(InString);
        await this.YWriteEx(Buf,Address,Buf.length,HKey,LKey,KeyPath); 
        if(this.lasterror<0)return this.lasterror;
        return Buf.length;
    }

    async YReadEx(address,  nlen,  HKey,  LKey,KeyPath )
    {  
        var ret = 0;
        var password = new Uint8Array(8 );
        var n, trashLen = 16;
        var OutData=[];
        var tmp_OutData;

        if ((address + nlen - 1 > MAX_LEN) || (address < 0)) return (-81);

        password=this.myconvert(HKey, LKey);
        var tmplen;
        var pos=0;
        while(nlen>0)
        {
            if(nlen>trashLen)
                tmplen=trashLen;
            else
            tmplen=nlen;
            tmp_OutData = await this.Sub_ReadByte(address + pos, tmplen, password,KeyPath);
            if (this.lasterror != 0) { return OutData; }
            OutData = this.concatenate(Uint8Array,OutData,tmp_OutData);
            nlen=nlen-trashLen;
            pos=pos+trashLen;
        }
        return OutData;
    }

    async YReadString( Address,  nlen, HKey,  LKey,KeyPath)
    {
        if(nlen==0)
        {
            this.lasterror=-80
            return ""
        }
        var outData=await this.YReadEx(Address,  nlen,  HKey,  LKey ,KeyPath);

        return this.DecodeStringEx(outData);
    }

    async NT_ReSet(KeyPath)
    {
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        var array_out=await this.SendWithDataNoErr(MYRESET,array_in,KeyPath);
        if(this.lasterror!=0)return this.lasterror;
        if (array_out[0] != 0)
        {
            this.lasterror= -82;
        }
        return this.lasterror;
    }

    async ReSet( KeyPath )
    {
        this.lasterror = await this.NT_ReSet(KeyPath);
        return this.lasterror;
    }

    async y_setcal(indata, password, KeyPath)
    {
        var n;
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        
        array_in[1] = 0;
        array_in[2] = 0;
        array_in[3] = 8;
        for (n = 0; n <= 7; n++)
        {
            array_in[4 + n] = password[n];
        }
        for (n = 0; n < 8; n++)
        {
            array_in[12 + n] = indata[n];
        }
        var array_out=await this.SendWithDataNoErr(6, array_in,KeyPath);
        if(this.lasterror)return this.lasterror;
        if (array_out[0] != 0)
        {
            this.lasterror= -82;
        }
        return this.lasterror;
    }

    async SetCal( HKey,  LKey,  new_HKey, new_LKey,  KeyPath)
    {
        var ary1=this.myconvert(HKey, LKey);
        var ary2=this.myconvert(new_HKey, new_LKey);

        this.lasterror = await this.y_setcal(ary2, ary1, KeyPath);

        return this.lasterror;
    }

    async NT_SetID(InBuf,  KeyPath)
    {
        var n;
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        for (n = 1; n <= 8; n++)
        {
            array_in[n] = InBuf[n - 2];
        }
        var array_out=await this.SendWithDataNoErr(7, array_in,KeyPath);
        if(this.lasterror!=0)return this.lasterror;
        if (array_out[0] != 0)
        {
            this.lasterror= -82;
        }
        return this.lasterror;
    }

    async SetID( Seed, KeyPath)
    {
        var KeyBuf=this.HexStringToByteArray(Seed);
    
        return await this.NT_SetID(KeyBuf, KeyPath);
    }

    async GetProduceDate( KeyPath)
    {
        var n;
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        var OutProduceDate=new Uint8Array(8);
        var array_out=await this.SendWithDataNoErr(15, array_in,KeyPath);
        if(this.lasterror!=0)return this.lasterror;
        for (n = 0; n < 8; n++)
        {
            OutProduceDate[n] = array_out[n];
        }
        return this.ByteArrayToHexString(OutProduceDate,8)
    }

    async SetHidOnly( IsHidOnly, KeyPath)
    {
        return await this.NT_SetHidOnly(IsHidOnly, KeyPath);
    }

    async NT_SetHidOnly( IsHidOnly, KeyPath)
    {
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        
        if (IsHidOnly) array_in[1] = 0; else array_in[1] = 0xff;
        var array_out=await this.SendWithDataNoErr(0x55, array_in,KeyPath);
        if(this.lasterror!=0)return this.lasterror;
        if (array_out[0] != 0)
        {
            return -82;
        }
        return 0;
    }

    async SetUReadOnly(KeyPath)
    {
        return  await this.NT_SetUReadOnly(KeyPath);
    }

    async NT_SetUReadOnly(KeyPath)
    {
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        var array_out=await this.SendWithDataNoErr(0x56, array_in,KeyPath);
        if(this.lasterror!=0)return this.lasterror;
        if (array_out[0] != 0)
        {
            return -82;
        }
        return 0;
    }

    async NT_Set_SM2_KeyPair(PriKey, PubKeyX, PubKeyY, sm2_UerName, KeyPath)
    {
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        var n = 0; 

        
        for (n = 0; n < ECC_MAXLEN; n++)
        {
            array_in[1 + n + ECC_MAXLEN * 0] = PriKey[n];
            array_in[1 + n + ECC_MAXLEN * 1] = PubKeyX[n];
            array_in[1 + n + ECC_MAXLEN * 2] = PubKeyY[n];
        }
        for (n = 0; n < SM2_USENAME_LEN; n++)
        {
            array_in[1 + n + ECC_MAXLEN * 3] = sm2_UerName[n];
        }

        var array_out=await this.SendWithDataNoErr(0x32, array_in,KeyPath);
        if(this.lasterror!=0)return this.lasterror;
        if (array_out[0] != 0x20) this.lasterror= USBStatusFail;

        return this.lasterror;
    }

    async NT_GenKeyPair(KeyPath)
    {
        var KEYPAIR={
            PriKey:null,
            PubKeyX:null,
            PubKeyY:null,
        };
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        var n = 0; 

        var array_out=await this.SendWithDataNoErr(GEN_KEYPAIR, array_in,KeyPath);
        if(this.lasterror!=0)return undefined; 
        if (array_out[0] != 0x20)
        {

            this.lasterror= FAILEDGENKEYPAIR;return undefined;

        }
        KEYPAIR.PriKey=array_out.slice(1,1 + ECC_MAXLEN );
        KEYPAIR.PubKeyX=array_out.slice(1 + ECC_MAXLEN+1,ECC_MAXLEN*2+1+1);
        KEYPAIR.PubKeyY=array_out.slice(1 + ECC_MAXLEN*2+1,ECC_MAXLEN*3+1+1);
        return KEYPAIR;
    }

    async NT_Get_SM2_PubKey( KeyPath)
    {
        var SM2_PubKeyInfo={
            KGx:null,
            KGy:null,
            sm2_UerName:null,
        }
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        var n = 0;  

        var array_out=await this.SendWithDataNoErr(0x33, array_in,KeyPath);
        if(this.lasterror!=0)return this.lasterror;
        if (array_out[0] != 0x20) 
        {
            this.lasterror= USBStatusFail;return this.lasterror;
        }

        SM2_PubKeyInfo.KGx = array_out.slice(1  ,1 + ECC_MAXLEN * 1);
        SM2_PubKeyInfo.KGy = array_out.slice(1 + ECC_MAXLEN * 1 ,1 + ECC_MAXLEN * 2);

        SM2_PubKeyInfo.sm2_UerName = array_out.slice(1 + ECC_MAXLEN * 2 ,1 + ECC_MAXLEN * 2 +SM2_USENAME_LEN);
        
        return SM2_PubKeyInfo;
    }

    async NT_Set_Pin(old_pin, new_pin, KeyPath)
    {

        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        var n = 0;  

        var b_oldpin  =this.encoder.encode(old_pin);
        var b_newpin  =this.encoder.encode(new_pin);
        for (n = 0; n < PIN_LEN; n++)
        {
            array_in[1 + PIN_LEN * 0 + n] = b_oldpin[n];
            array_in[1 + PIN_LEN * 1 + n] = b_newpin[n];
        }

        var array_out=await this.SendWithDataNoErr(SET_PIN, array_in,KeyPath);
        if(this.lasterror!=0)return this.lasterror;
        if (array_out[0] != 0x20) 
        {
            this.lasterror= USBStatusFail;return this.lasterror;
        }
        if (array_out[1] != 0x20) 
        {
            this.lasterror= FAILPINPWD;
        }
        return this.lasterror;
    }

    async NT_SM2_Enc( inbuf,  inlen, KeyPath)
    {
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        var outbuf=new Uint8Array(inlen + SM2_ADDBYTE);
        var n = 0;  

        array_in[1] = inlen;
        for (n = 0; n < inlen; n++)
        {
            array_in[2 + n] = inbuf[n];
        }
        var array_out=await this.SendWithDataNoErr(MYENC, array_in,KeyPath);
        if(this.lasterror!=0)
        {
            return outbuf;
        }
        if (array_out[0] != 0x20) 
        {
            this.lasterror= USBStatusFail;
            return outbuf;
        }
        if (array_out[1] == 0) 
        {
            this.lasterror= FAILENC;
            return outbuf;
        }

        for (n = 0; n < (inlen + SM2_ADDBYTE); n++)
        {
            outbuf[n] = array_out[2 + n];
        }

        return outbuf;
    }

    async NT_SM2_Dec( inbuf, inlen, pin, KeyPath)
    {
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        var outbuf=new Uint8Array(inlen - SM2_ADDBYTE);
        var n = 0;  

        var b_pin =this.encoder.encode(pin);
        for (n = 0; n < PIN_LEN; n++)
        {
            array_in[1 + PIN_LEN * 0 + n] = b_pin[n];
        }
        array_in[1 + PIN_LEN] = inlen;
        for (n = 0; n < inlen; n++)
        {
            array_in[1 + PIN_LEN + 1 + n] = inbuf[n];
        }
        var array_out=await this.SendWithDataNoErr(MYDEC, array_in,KeyPath);
        if(this.lasterror!=0)
        {
            return outbuf;
        }
        if (array_out[2] != 0x20)
        {
            this.lasterror= FAILPINPWD; return outbuf;
        } 
        if (array_out[1] == 0) 
        {
            this.lasterror= FAILENC; return outbuf;
        }
        if (array_out[0] != 0x20) 
        {
            this.lasterror= USBStatusFail; return outbuf;
        }
        for (n = 0; n < (inlen - SM2_ADDBYTE); n++)
        {
            outbuf[n] = array_out[3 + n];
        }

        return outbuf;
    }

    async sub_NT_Sign(cmd, inbuf, pin, KeyPath)
    {
        var outbuf = new Uint8Array(ECC_MAXLEN*2) ;
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        var n = 0;  

        var b_pin =this.encoder.encode(pin);
        for (n = 0; n < PIN_LEN; n++)
        {
            array_in[1 + PIN_LEN * 0 + n] = b_pin[n];
        }
        for (n = 0; n < 32; n++)
        {
            array_in[1 + PIN_LEN + n] = inbuf[n];
        }
        var array_out=await this.SendWithDataNoErr(cmd, array_in,KeyPath);
        if(this.lasterror!=0)
        {
            return outbuf;
        }
        if (array_out[1] != 0x20) 
        {
            this.lasterror=FAILPINPWD;
            return outbuf;
        }
        if (array_out[0] != 0x20) 
        {
            this.lasterror= USBStatusFail;
            return outbuf;
        }
        for (n = 0; n < ECC_MAXLEN*2; n++)
        {
            outbuf[n] = array_out[2 + n];
        }

        return outbuf;
    }

    async NT_Sign( inbuf,  pin, KeyPath)
    {
        return await this.sub_NT_Sign(0x51, inbuf,pin,KeyPath);
    }

    async NT_Sign_2( inbuf,  pin, KeyPath)
    {

        return await this.sub_NT_Sign(0x53, inbuf,pin,KeyPath);
    }

    async NT_Verfiy( inbuf,  InSignBuf,  KeyPath)
    {
        var array_in = new Uint8Array(MAX_TRANSE_LEN) ;
        var n = 0;  

        for (n = 0; n < ECC_MAXLEN; n++)
        {
            array_in[1 + n] = inbuf[n];
        }
        for (n = 0; n < ECC_MAXLEN*2; n++)
        {
            array_in[1 + ECC_MAXLEN + n] = InSignBuf[n];
        }
        var array_out=await this.SendWithDataNoErr(YTVERIFY, array_in,KeyPath);
        if(this.lasterror!=0)return false;
        var outbiao = (array_out[1] != 0);
        if (array_out[0] != 0x20) 
        {
            this.lasterror=USBStatusFail;return false;
        }

        return outbiao;
    }

    async StarGenKeyPair(KeyPath)
    {
        var n; 
        var KeyPairInfo={
            GenPriKey:"",
            PubKeyX:"",
            PubKeyY:"",
        } 
        var KEYPAIR=await this.NT_GenKeyPair(KeyPath);
        if(this.lasterror)return KeyPairInfo;
        KeyPairInfo.GenPriKey = this.ByteArrayToHexString(KEYPAIR.PriKey, ECC_MAXLEN);
        KeyPairInfo.GenPubKeyX = this.ByteArrayToHexString(KEYPAIR.PubKeyX, ECC_MAXLEN);
        KeyPairInfo.GenPubKeyY = this.ByteArrayToHexString(KEYPAIR.PubKeyY, ECC_MAXLEN);
        
        return KeyPairInfo;
    }

    async Set_SM2_KeyPair(PriKey, PubKeyX, PubKeyY, SM2_UserName, KeyPath)
    {

        var b_PriKey=this.HexStringToByteArray(PriKey);
        var b_PubKeyX=this.HexStringToByteArray(PubKeyX);
        var b_PubKeyY=this.HexStringToByteArray(PubKeyY);

        var b_SM2UserName  =this.encoder.encode(SM2_UserName);

        return await this.NT_Set_SM2_KeyPair(b_PriKey, b_PubKeyX, b_PubKeyY, b_SM2UserName, KeyPath);
    }

    async Get_SM2_PubKey(KeyPath)
    {
    var PubKeyInfo={
        PubKeyX:"",
        PubKeyY:"",
        sm2UserName:"",
    }
        
        var  SM2_PubKeyInfo=await this.NT_Get_SM2_PubKey( KeyPath);
    
        PubKeyInfo.PubKeyX = this.ByteArrayToHexString(SM2_PubKeyInfo.KGx, ECC_MAXLEN);
        PubKeyInfo.PubKeyY = this.ByteArrayToHexString(SM2_PubKeyInfo.KGy, ECC_MAXLEN);
        PubKeyInfo.sm2UserName= this.DecodeStringEx(SM2_PubKeyInfo.sm2_UerName)
        return PubKeyInfo;
    }

    async GetPubKeyX(KeyPath)
    {
        var PubKeyInfo=await this.Get_SM2_PubKey(KeyPath)
        if(this.lasterror!=0)return "";
        return PubKeyInfo.PubKeyX;
    }

    async GetPubKeyY(KeyPath)
    {
        var PubKeyInfo=await this.Get_SM2_PubKey(KeyPath)
        if(this.lasterror!=0)return "";
        return PubKeyInfo.PubKeyY;
    }

    async GetSm2UserName(KeyPath)
    {
        var PubKeyInfo=await this.Get_SM2_PubKey(KeyPath)
        if(this.lasterror!=0)return "";
        return PubKeyInfo.sm2UserName;
    }

    async SM2_EncBuf( InBuf, inlen, KeyPath)
    {
        var  n, temp_inlen, incount = 0, outcount = 0;  
        var temp_InBuf = new Uint8Array(MAX_ENCLEN+ SM2_ADDBYTE)
        var OutBuf=[];
        //InBuf.copy(OutBuf);
        while (inlen > 0)
        {
            if (inlen > MAX_ENCLEN)
                temp_inlen = MAX_ENCLEN;
            else
                temp_inlen = inlen;
            for (n = 0; n < temp_inlen; n++)
            {
                temp_InBuf[n] = InBuf[incount + n];
            }
            var temp_OutBuf =await  this.NT_SM2_Enc(temp_InBuf, temp_inlen, KeyPath);
            if(this.lasterror)return OutBuf;
            OutBuf = this.concatenate(Uint8Array,OutBuf,temp_OutBuf);
            inlen = inlen - MAX_ENCLEN;
            incount = incount + MAX_ENCLEN;
            outcount = outcount + MAX_DECLEN;
        }
        return OutBuf;
    }

    async SM2_DecBuf( InBuf, inlen, pin, KeyPath)
    {
        var temp_inlen, n, incount = 0, outcount = 0;  
        var temp_InBuf = new Uint8Array(MAX_ENCLEN+ SM2_ADDBYTE)
        var OutBuf=new Uint8Array(InBuf.length);
        //var b=new Buffer(InBuf)
        //b.copy(OutBuf);
        var OutBuf=[];
        while (inlen > 0)
        {
            if (inlen > MAX_DECLEN)
                temp_inlen = MAX_DECLEN;
            else
                temp_inlen = inlen;
            for (n = 0; n < temp_inlen; n++)
            {
                temp_InBuf[n] = InBuf[incount + n];
            }
            var temp_OutBuf =await  this.NT_SM2_Dec(InBuf, temp_inlen, pin, KeyPath);
            if(this.lasterror)return OutBuf;
            OutBuf =this.concatenate(Uint8Array,OutBuf,temp_OutBuf);
            inlen = inlen - MAX_DECLEN;
            incount = incount + MAX_DECLEN;
            outcount = outcount + MAX_ENCLEN;
        }
        return OutBuf;
    }

    async SM2_EncString(InString,  KeyPath)
    {
        var InBuf=this.encoder.encode(InString);
        var OutBuf=await this.SM2_EncBuf(InBuf, InBuf.length, KeyPath);
        if(this.lasterror)return OutBuf;
        return  this.ByteArrayToHexString(OutBuf, OutBuf.length);
    }

    async SM2_DecString(InString,  pin, KeyPath)
    {
        var InBuf=this.HexStringToByteArray(InString);

        var OutBuf=await this.SM2_DecBuf(InBuf, InBuf.length, pin, KeyPath);
        if(this.lasterror)return OutBuf;
        return this.DecodeStringEx(OutBuf);
    }

    async YtSetPin(old_pin, new_pin, KeyPath)
    {
        return  await this.NT_Set_Pin(old_pin, new_pin, KeyPath);
    }

    async Sub_YtSign(cmd, msg,  pin,  KeyPath)
    {
        var OutSign;
        
        var MsgHashvalue = sm3(msg);
        var InBuf=this.HexStringToByteArray(MsgHashvalue);
        var OutBuf =await  this.sub_NT_Sign(cmd, InBuf,pin,KeyPath);
        if(this.lasterror!=0)return OutSign;
        OutSign =this.ByteArrayToHexString(OutBuf,OutBuf.length)
        return OutSign;
    }

    async YtSign(msg,  pin,  KeyPath)
    {
        return await this.Sub_YtSign(0x51,msg,pin,KeyPath)
    }

    async YtSign_2(msg,  pin,  KeyPath)
    {
        return await this.Sub_YtSign(0x53,msg,pin,KeyPath)
    }

    MacAddr()
    {
        alert("无服务方式不支持获取电脑的MAC地址！")
    }

    StrEnc(InString, Key)
    {
        var n;var m;
        var nlen;

        var b=this.encoder.encode(InString);
        var zero_buf = new Uint8Array(1);
        b = this.concatenate(Uint8Array,b,zero_buf);
        nlen=b.length;
        if( b.length < 8)
        {
            nlen= 8;
        }

        var outb=new Uint8Array(nlen);
        var inb=new Uint8Array(nlen);
        inb=b.slice();//如果少于8，则会补0，这里主要是用于补0
        outb=b.slice();
        
        for(n=0;n<=(nlen-8);n=n+8)
        {
            var tmpoutb = this.sub_EnCode(inb,n,Key);
            for(m=0;m<8;m++)
            {
                outb[m+n]=tmpoutb[m];
            }
        }
        
        return this.ByteArrayToHexString(outb,outb.length);
    }

    DecString( InString,  Key)
    {
        return this.StrDec( InString,  Key)
    }

    StrDec( InString,  Key)//
    {
        var n,m;
        var inb=this.HexStringToByteArray(InString);
        var outb= new Uint8Array(inb.length );
        outb=inb.slice();

        for( n = 0; n<=inb.length - 8 ;n=n+ 8)
        {
            var tmpoutb =this.sub_DeCode(inb,n,Key);
            for(m=0;m<8;m++)
            {
                outb[m+n]=tmpoutb[m];
            }
        }

        return  this.DecodeStringEx(outb);
    }

    EnCode(inb,Key)
    {
        this.sub_EnCode(inb,0,Key);
    }

    sub_EnCode(inb,pos,Key ) 
    {
        var cnDelta, y, z, a, b, c, d;
        var outb=new Uint8Array(8);
        var n, i, nlen;
        var sum;
        var temp, temp_1;
        
        var buf = new Array(16);
        var temp_string;
        
        cnDelta = 2654435769;
        sum = 0;

        nlen = Key.length ;
        i = 0;
        for (n = 1; n <= nlen; n = n + 2)
        {
            temp_string= Key.substring(n-1, n-1+2);
            buf[i] = this.HexToInt(temp_string);
            i = i + 1;
        }
        a = 0; b = 0; c = 0; d = 0;
        for (n = 0; n <= 3; n++)
        {
            a = (buf[n] << (n * 8)) | a; 
            b = (buf[n + 4] << (n * 8)) | b;
            c = (buf[n + 4 + 4] << (n * 8)) | c;
            d = (buf[n + 4 + 4 + 4] << (n * 8)) | d;
        }
    
        y = 0;
        z = 0;
        for (n = 0; n <= 3; n++)
        {
            y = (inb[n + pos] << (n * 8)) | y;
            z = (inb[n + 4 + pos]<< (n * 8)) | z;
        }

        n = 32;

        while (n > 0)
        {
            sum = cnDelta + sum;

            temp = (z << 4) & 0xFFFFFFFF; 
        
            temp = (temp + a) & 0xFFFFFFFF; 
            temp_1 = (z + sum) & 0xFFFFFFFF;  
            temp = (temp ^ temp_1) & 0xFFFFFFFF; 
            temp_1 = (z >>>5) & 0xFFFFFFFF;  
            temp_1 = (temp_1 + b) & 0xFFFFFFFF;  
            temp = (temp ^ temp_1) & 0xFFFFFFFF;  
            temp = (temp + y) & 0xFFFFFFFF; 
            y = temp & 0xFFFFFFFF; 
        // y += ((z << 4) + a) ^ (z + sum) ^ ((z >> 5) + b);

            temp = (y << 4) & 0xFFFFFFFF;
            temp = (temp + c) & 0xFFFFFFFF;
            temp_1 = (y + sum) & 0xFFFFFFFF;
            temp = (temp ^ temp_1) & 0xFFFFFFFF;
            temp_1 = (y >>> 5) & 0xFFFFFFFF;
            temp_1 = (temp_1 + d) & 0xFFFFFFFF;
            temp = (temp ^ temp_1) & 0xFFFFFFFF;
            temp = (z + temp) & 0xFFFFFFFF;
            z = temp & 0xFFFFFFFF;
        //  z += ((y << 4) + c) ^ (y + sum) ^ ((y >> 5) + d);
        
            n = n - 1;

        }
        
        for (n = 0; n <= 3; n++)
        {
            outb[n] = ((y >>> (n * 8)) & 255);
            outb[n + 4] = ((z >>> (n * 8)) & 255);
        }
        return outb;
    } 

    DeCode()
    {
        sub_DeCode(inb,0,Key );
    }

    sub_DeCode(inb,pos,Key ) 
    {
            var cnDelta, y, z, a, b, c, d;
            var outb=new Uint8Array(8);
            var n, i, nlen;
            var sum;
            var temp, temp_1;
            
            var buf = new Array(16);
            var temp_string;

            cnDelta = 2654435769;
            sum = 3337565984;

            nlen = Key.length ;
            i = 0;
            for (n = 1; n <= nlen; n = n + 2)
            {
                temp_string= Key.substring(n-1, n-1+2);
                buf[i] = this.HexToInt(temp_string);
                i = i + 1;
            }
            a = 0; b = 0; c = 0; d = 0;
            for (n = 0; n <= 3; n++)
            {
                a = (buf[n] << (n * 8)) | a; 
                b = (buf[n + 4] << (n * 8)) | b;
                c = (buf[n + 4 + 4] << (n * 8)) | c;
                d = (buf[n + 4 + 4 + 4] << (n * 8)) | d;
            }
        
            y = 0;
            z = 0;
            for (n = 0; n <= 3; n++)
            {
                y = (inb[n + pos] << (n * 8)) | y;
                z = (inb[n + 4 + pos]<< (n * 8)) | z;
            }

            n = 32;

            while (n > 0)
            {
                
                temp = (y << 4) & 0xFFFFFFFF;
                temp = (temp + c) & 0xFFFFFFFF;
                temp_1 = (y + sum) & 0xFFFFFFFF;
                temp = (temp ^ temp_1) & 0xFFFFFFFF;
                temp_1 = (y >>> 5) & 0xFFFFFFFF;
                temp_1 = (temp_1 + d) & 0xFFFFFFFF;
                temp = (temp ^ temp_1) & 0xFFFFFFFF;
                temp = (z - temp) & 0xFFFFFFFF;
                z = temp & 0xFFFFFFFF;
            //  z += ((y << 4) + c) ^ (y + sum) ^ ((y >> 5) + d);

                temp = (z << 4) & 0xFFFFFFFF; 
                temp = (temp + a) & 0xFFFFFFFF; 
                temp_1 = (z + sum) & 0xFFFFFFFF;  
                temp = (temp ^ temp_1) & 0xFFFFFFFF; 
                temp_1 = (z >>>5) & 0xFFFFFFFF;  
                temp_1 = (temp_1 + b) & 0xFFFFFFFF;  
                temp = (temp ^ temp_1) & 0xFFFFFFFF;  
                temp = ( y -temp) & 0xFFFFFFFF; 
                y = temp & 0xFFFFFFFF; 
            // y += ((z << 4) + a) ^ (z + sum) ^ ((z >> 5) + b);

            
            
                sum = sum-cnDelta;
                n = n - 1;

            }
            
            for (n = 0; n <= 3; n++)
            {
                outb[n] = ((y >>> (n * 8)) & 255);
                outb[n + 4] = ((z >>> (n * 8)) & 255);
            }
            return outb;
    } 


}

//vid,pid
SoftKey3A.VID = 0x3689;
SoftKey3A.PID = 0x8762;
SoftKey3A.PID_NEW = 0X2020;
SoftKey3A.VID_NEW = 0X3689;
SoftKey3A.PID_NEW_2 = 0X2020;
SoftKey3A.VID_NEW_2 = 0X2020;




   
const User=require("./user.js");


class Dosen extends User{


    constructor(id,username,password,nidn,nama){

        super(
            id,
            username,
            password,
            "dosen"
        );


        this.nidn=nidn;
        this.nama=nama;

    }


    approveKRS(keranjang){

        keranjang.statusApprove=true;

    }


}


module.exports=Dosen;
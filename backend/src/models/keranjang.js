class KeranjangKRS{


    constructor(mahasiswa){

        this.mahasiswa=mahasiswa;

        this.items=[];

        this.statusApprove=false;

        this.statusCheckout=false;

    }



    tambahMatkul(kelas,matakuliah){

        this.items.push({

            kelas,
            matakuliah

        });


    }



    hitungSKS(){

        return this.items.reduce(

            (total,item)=>{

                return total + item.matakuliah.sks;

            },0

        );

    }



    hitungHarga(){

        return this.items.reduce(

            (total,item)=>{

                return total + item.matakuliah.harga;

            },0

        );

    }



    checkout(){

        if(this.statusApprove){

            this.statusCheckout=true;

            return true;

        }


        return false;

    }



}


module.exports=KeranjangKRS;
'use strict';

import Base from './base.js';

export default class extends Base {
  /**
   * get
   * @return {[type]} [description]
   */
 async getAction(self){
    //this.modelInstance.setRelation(false);
    if(this.get('pid')) {
     console.log(123);
     this.modelInstance.where({pid: this.get('pid')});
    }
    //let data;
    //data = await this.modelInstance.select();
    //data.map(cate =>{
    //  cate.id=cate._id;
    //})
    //return this.success(data);
    return super.getAction(self);
  }

  /**
   * add user
   * @return {[type]} [description]
   */
  async postAction(){
    let data = this.post();

    let ret = await this.modelInstance.addCate(data);
    if(ret.type === 'exist'){
      return this.fail('CATE_EXIST');
    }
    return this.success({id: ret.id});
  }
  /**
   * update user info
   * @return {[type]} [description]
   */
  async putAction(){
    if (!this.id) {
      return this.fail('PARAMS_ERROR');
    }
    let data = this.post();
    data.id = this.id;
    let rows = await this.modelInstance.saveCate(data);
    return this.success({affectedRows: rows});
  }
}

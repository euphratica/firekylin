'use strict';
/**
 * relation model
 */
export default class extends think.model.mongo {
  /**
   * init
   * @param  {} args []
   * @return {}         []
   */
  init(...args){
    super.init(...args);

    this.tableName = "tag";
    this.tablePrefix = "";
  }

  addTag(data){
    let where = {
      name: data.name, 
      _logic: 'OR'
    };
    if(data.pathname){
      where.pathname = data.pathname;
    }
    return this.where(where).thenAdd(data);
  }

  async saveTag(data){
    let info = await this.where({_id: data.id}).find();
    if(think.isEmpty(info)){
      return Promise.reject(new Error('TAG_NOT_EXIST'));
    }

    return this.where({_id: data.id}).update(data);
  }
}

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

    this.tableName = "cate";
    this.tablePrefix = "";
  }

  /**
   * 添加分类
   * @param {[type]} data [description]
   * @param {[type]} ip   [description]
   */
  addCate(data){
    let where = {
      name: data.name, 
      _logic: 'OR'
    };
    if(data.pathname){
      where.pathname = data.pathname;
    }
    return this.where(where).thenAdd(data);
  }

  async saveCate(data){
    let info = await this.where({id: data.id}).find();
    if(think.isEmpty(info)){
      return Promise.reject(new Error('CATE_NOT_EXIST'));
    }

    return this.where({id: data.id}).update(data);
  }

  /**
   * get count posts
   * @param  {Number} userId []
   * @return {Promise}        []
   */
  getCount(userId){
    if(userId){
      return this.where({user_id: userId}).count();
    }
    return this.count();
  }
  /**
   * get latest posts
   * @param  {Number} nums []
   * @return {}      []
   */
  getLatest(nums = 5){
    return this.order('id DESC').limit(nums).select();
  }
}

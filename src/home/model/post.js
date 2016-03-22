'use strict';
/**
 * model
 */
export default class extends think.model.mongo {
  /**
   * relation
   * @type {Object}
   */
  init(...args){
    super.init(...args);

    this.tableName = "post";
    this.tablePrefix = "";
  }
  /**
   * get where condition
   * @param  {[type]} where [description]
   * @return {[type]}       [description]
   */
  getWhereCondition(where){
    return think.extend({}, where, {
    create_time: {'<=': think.datetime()},
      is_public: '1', //公开
      type: '0', //文章
      status: '3' //已经发布
    })
  }
  /**
   * get post list
   * @param  {[type]} page  [description]
   * @param  {[type]} where [description]
   * @return {[type]}       [description]
   */
  async getPostList(page, options = {}){
    let field = options.field || 'id,title,pathname,create_time,summary,comment_num';
    if(options.tag || options.cate){
      let name = options.tag ? 'tag' : 'cate';
      let {id} = await this.model(name).field('id').where({name: options.tag || options.cate}).find();
      if(think.isEmpty(id)){
        return false;
      }
      let where = this.getWhereCondition({[`${name}.${name}_id`]: id});
      return this.join({
        table: `post_${name}`,
        as: name,
        on: ['id', 'post_id']
      }).where(where).countSelect();
    }
    
    let where = this.getWhereCondition(options.where);
console.log(where);
    let data = await this.field(field).page(page).order('create_time DESC').where(where).countSelect();
    console.log(data);
    return data;
  }

  /**
   * get post detail info
   * @param  {[type]} pathname [description]
   * @return {[type]}          [description]
   */
  async getPostDetail(pathname){
    let where = this.getWhereCondition({pathname: pathname});
    let detail = await this.where(where).fieldReverse('markdown_content,summary').find();
    if(think.isEmpty(detail)){
      return detail;
    }
    let prevPromise = this.field('title,pathname').where(this.getWhereCondition({id: ['<', detail.id]})).order('create_time DESC').find();
    let nextPromise = this.field('title,pathname').where(this.getWhereCondition({id: ['>', detail.id]})).order('create_time ASC').find();
    let [prev, next] = await Promise.all([prevPromise, nextPromise]);
    return {
      detail,
      prev,
      next
    }
  }
  async getPostRssList(){
    let field = 'id,title,pathname,content';
    let where = this.getWhereCondition();

    let data = await this.field(field).where(where).order('create_time DESC').limit(10).select();
    return data;
  }

  async getPostSitemapList(){
    let field = 'pathname,update_time';
    let where = this.getWhereCondition();

    let data = await this.field(field).where(where).order('update_time DESC').select();
    return data;
  }
  /**
   * get post archive
   * @return {[type]} [description]
   */
  async getPostArchive(){
    let where = this.getWhereCondition();
    let data = await this.field('id,title,pathname,create_time').order('create_time DESC').where(where).select();
    let result = {};
    data.forEach(item => {
      let yearMonth = think.datetime(item.create_time, 'YYYY年MM月');
      if(!(yearMonth in result)){
        result[yearMonth] = [];
      }
      result[yearMonth].push(item);
    });
    return result;
  }
  /**
   * get post search result
   * @param  {[type]} keyword [description]
   * @param  {[type]} page    [description]
   * @return {[type]}         [description]
   */
  async getPostSearch(keyword, page){
    let where = {'title|content': ['LIKE', `%${keyword}%`]}
    where = this.getWhereCondition(where);
    return this.where(where).page(page).field('title,pathname,summary,create_time').order('create_time DESC').countSelect();
  }
}
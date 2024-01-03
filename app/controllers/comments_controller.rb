class CommentsController < ApplicationController
  def create
    @comment = Comment.create(create_or_update_params)

    @commentable = @comment.commentable

    res = @commentable.class.method_defined?(:comments) ?
      @commentable.comments :
      @commentable.comment

    render json: res, :include => [:user]
  end

  def update
      @comment = Comment.find(params[:id])

      @comment.update(create_or_update_params)

      @commentable = @comment.commentable

      res = @commentable.class.method_defined?(:comments) ?
        @commentable.comments :
        @commentable.comment

      render json: res, :include => [:user]
  end

  def destroy
    Comment.find(params[:id]).destroy

    render :json => {}
  end

  private
  def create_or_update_params
    params.require(:comment).permit(:commentable_id, :commentable_type, :user_id, :content)
  end
end
